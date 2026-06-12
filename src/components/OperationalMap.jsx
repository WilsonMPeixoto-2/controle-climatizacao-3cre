import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import polylabel from 'polylabel';
import creBairros from '../data/cre-bairros.geo.json';
import { normalizeString, escapeHtml } from '../lib/logic.js';
import { topRiskBairros } from '../lib/mapRisk.js';

/**
 * Pintura sóbria dos bairros (padrão consolidado do projeto):
 * cor forte SOMENTE onde há chamado crítico ou em atenção; bairros com
 * demanda recente recebem azul discreto; os demais recuam para o fundo.
 * Nenhuma escala numérica é exibida — a leitura é operacional, não estatística.
 */
function getBairroStyle(feature, theme, risk) {
  const nm = feature.properties?.NOME || '';
  const b = risk[normalizeString(nm)];
  const isDark = theme === 'dark';

  let color;
  let fillColor;
  let fillOpacity;
  let weight;

  if (isDark) {
    color = 'rgba(148, 163, 184, 0.4)';
    fillColor = 'hsl(215, 12%, 40%)';
    fillOpacity = 0.08;
    weight = 1.2;

    if (b && b.chamados_ativos > 0) {
      if (b.criticos > 0) {
        color = 'hsl(350, 80%, 55%)';
        fillColor = 'hsl(350, 75%, 48%)';
        fillOpacity = 0.26;
        weight = 1.6;
      } else if (b.atencao > 0) {
        color = 'hsl(38, 95%, 52%)';
        fillColor = 'hsl(38, 92%, 48%)';
        fillOpacity = 0.22;
        weight = 1.5;
      } else {
        color = 'hsl(201, 85%, 55%)';
        fillColor = 'hsl(201, 80%, 48%)';
        fillOpacity = 0.18;
        weight = 1.4;
      }
    }
  } else {
    // Tema claro: paleta translúcida editorial (contornos foscos, fundos suaves)
    fillOpacity = 0.45;

    if (b && b.chamados_ativos > 0) {
      if (b.criticos > 0) {
        color = '#D98287';
        fillColor = '#FCE8E6';
        weight = 1.6;
      } else if (b.atencao > 0) {
        color = '#D8B85A';
        fillColor = '#FDF6E2';
        weight = 1.4;
      } else {
        color = '#7DAFCC';
        fillColor = '#EBF3F9';
        weight = 1.3;
      }
    } else if (b && b.escolas_cadastradas > 0) {
      color = '#6EAD7A';
      fillColor = '#EEF7F0';
      weight = 1.2;
    } else {
      color = 'rgba(148, 163, 184, 0.45)';
      fillColor = 'transparent';
      fillOpacity = 0;
      weight = 0.85;
    }
  }

  return {
    color,
    weight,
    opacity: isDark ? 0.95 : 0.85,
    fillColor,
    fillOpacity
  };
}

function rotuloNivel(nivel) {
  switch (nivel) {
    case 'critico': return 'Crítico';
    case 'alto': return 'Alto';
    case 'moderado': return 'Moderado';
    case 'vigilancia': return 'Vigilância';
    case 'em-dia': return 'Em dia';
    default: return 'Sem cobertura';
  }
}

// Ponto ótimo de rótulo ("pole of inaccessibility") — sempre DENTRO do polígono,
// mesmo em formas côncavas ou em "L", onde o centro do bounding box cai fora.
function labelPointFor(layer) {
  const gj = layer.feature?.geometry;
  try {
    if (gj?.type === 'Polygon') {
      const p = polylabel(gj.coordinates, 0.0001);
      return L.latLng(p[1], p[0]);
    }
    if (gj?.type === 'MultiPolygon') {
      let best = null;
      for (const poly of gj.coordinates) {
        const p = polylabel(poly, 0.0001);
        if (!best || p.distance > best.distance) best = p;
      }
      if (best) return L.latLng(best[1], best[0]);
    }
  } catch {
    // cai no fallback geométrico abaixo
  }
  return layer.getBounds().getCenter();
}

export default function OperationalMap({
  selectedSchool,
  theme,
  onSelectBairro,
  focusedBairro,
  risk
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const geoJsonRef = useRef(null);
  const layersRef = useRef({});
  const labelMarkersRef = useRef([]);

  // Rótulos permanentes dinâmicos: os 3 bairros de maior risco (nível alto/crítico)
  function renderTopLabels() {
    if (!mapRef.current) return;
    labelMarkersRef.current.forEach((m) => {
      try {
        m.unbindTooltip();
        m.remove();
      } catch {
        // Silencioso
      }
    });
    labelMarkersRef.current = [];

    for (const [bairroNorm, b] of topRiskBairros(risk, 3)) {
      const layer = layersRef.current[bairroNorm];
      if (!layer) continue;
      const center = labelPointFor(layer);
      const html = `<div class="map-toplabel">${escapeHtml(b.nome_exibicao)}</div>`;
      const marker = L.marker(center, {
        interactive: false,
        icon: L.divIcon({ className: 'map-toplabel-wrap', html, iconSize: null })
      }).addTo(mapRef.current);
      labelMarkersRef.current.push(marker);
    }
  }

  // 2. Efeito de Inicialização do Mapa (Roda apenas uma vez no mount)
  useEffect(() => {
    if (mapRef.current || !elRef.current) return;

    const map = L.map(elRef.current, {
      center: [-22.88, -43.28], // Zona Norte fallback
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      dragging: true,
      attributionControl: true
    });
    mapRef.current = map;

    // Define tile layer inicial baseado no tema
    const isDark = theme === 'dark';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© OpenStreetMap · © CARTO'
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Instancia camada GeoJSON
    const geoJson = L.geoJSON(creBairros, {
      className: 'cre-glow',
      style: (f) => getBairroStyle(f, theme, risk),
      onEachFeature: (f, l) => {
        const nm = f.properties?.NOME || '';
        const normalized = normalizeString(nm);

        // Guarda referência do layer para foco futuro
        layersRef.current[normalized] = l;

        // Estrutura estática (não depende de dados): registrada UMA vez, no add.
        // O aria-label dinâmico e a classe is-critico vivem no useEffect reativo.
        l.on('add', () => {
          const el = l.getElement && l.getElement();
          if (!el) return;
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
          el.classList.add('bairro-focavel');
          L.DomEvent.on(el, 'keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              if (onSelectBairro) onSelectBairro(normalized);
            }
          });
        });

        // Evento de Clique: aciona o callback no App.jsx
        l.on('click', () => {
          if (onSelectBairro) {
            onSelectBairro(normalized);
          }
        });
      }
    }).addTo(map);
    geoJsonRef.current = geoJson;

    map.fitBounds(geoJson.getBounds(), { padding: [22, 22] });
    map.setMaxBounds(geoJson.getBounds().pad(2.5));

    // Corrige renderizações tardias do container CSS com segurança
    const t = setTimeout(() => {
      try {
        if (mapRef.current && elRef.current?.isConnected) {
          mapRef.current.invalidateSize();
        }
      } catch (e) {
        console.warn('Leaflet: Erro ao invalidar tamanho no timeout:', e);
      }
    }, 80);

    // Cria um ResizeObserver seguro para monitorar o redimensionamento do contêiner no mobile
    let resizeObserver;
    if (window.ResizeObserver && elRef.current) {
      resizeObserver = new ResizeObserver(() => {
        try {
          if (mapRef.current && elRef.current?.isConnected) {
            mapRef.current.invalidateSize();
          }
        } catch (e) {
          console.warn('Leaflet: Erro ao invalidar tamanho no ResizeObserver:', e);
        }
      });
      resizeObserver.observe(elRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(t);
      if (mapRef.current) {
        try {
          if (mapRef.current.closeTooltip) {
            mapRef.current.closeTooltip();
          }
        } catch {
          // Silencioso
        }

        labelMarkersRef.current.forEach((m) => {
          try {
            m.unbindTooltip();
            m.remove();
          } catch {
            // Silencioso
          }
        });
        labelMarkersRef.current = [];

        try {
          if (geoJsonRef.current) {
            geoJsonRef.current.eachLayer((l) => {
              try {
                l.unbindTooltip();
                l.off();
              } catch {
                // Silencioso
              }
            });
          }
        } catch {
          // Silencioso
        }

        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn('Leaflet: Erro ao remover mapa no cleanup:', e);
        }
      }
      mapRef.current = null;
      tileLayerRef.current = null;
      geoJsonRef.current = null;
      layersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Efeito Reativo de Atualização de Dados e Tema (In-place sem destruir o mapa)
  useEffect(() => {
    if (!mapRef.current || !geoJsonRef.current || !mapRef.current._loaded) return;

    // Atualiza o Tile Layer para o tema correto
    if (tileLayerRef.current) {
      const isDark = theme === 'dark';
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
      tileLayerRef.current.setUrl(tileUrl);
    }

    // Atualiza os estilos de cada polígono GeoJSON
    geoJsonRef.current.setStyle((f) => getBairroStyle(f, theme, risk));

    // Atualiza os tooltips, aria-labels, classes is-critico e comportamentos hover
    geoJsonRef.current.eachLayer((l) => {
      const f = l.feature;
      if (!f) return;
      const nm = f.properties?.NOME || '';
      const normalized = normalizeString(nm);
      const b = risk[normalized] || {
        nome_exibicao: nm,
        escolas_cadastradas: 0,
        chamados_ativos: 0,
        criticos: 0,
        atencao: 0,
        risco: 0,
        nivel: 'sem-cobertura',
        densidade: 0,
        temCritico: false
      };

      const escapedNm = escapeHtml(nm);
      const normais = Math.max(0, b.chamados_ativos - b.criticos - b.atencao);
      const pct = (x) => (b.chamados_ativos ? Math.round((x / b.chamados_ativos) * 100) : 0);

      let ofensoresHtml = '';
      if (b.topOfensores && b.topOfensores.length > 0) {
        ofensoresHtml = `
          <div class="map-tooltip-ofensores">
            <div class="map-tooltip-ofensores-title">Principais Ofensores:</div>
            ${b.topOfensores
              .map(
                (o) => `
              <div class="map-tooltip-ofensor-item">
                <span class="ofensor-id">${escapeHtml(o.id_chamado)}</span> · 
                <span class="ofensor-school">${escapeHtml(o.unidade_escolar)}</span> 
                <span class="ofensor-days">(${o.inactivityDays}d)</span>
              </div>
            `
              )
              .join('')}
          </div>
        `;
      }

      // Tooltip dinâmico rico atualizado
      const tooltipHtml = `
        <div class="map-tooltip map-tooltip-v2">
          <div class="map-tooltip-head">
            <span class="map-tooltip-title">${escapedNm}</span>
            <span class="map-nivel-badge nivel-${b.nivel}">${rotuloNivel(b.nivel)}</span>
          </div>
          <div class="map-tooltip-row"><span>Escolas Cadastradas</span><strong>${b.escolas_cadastradas}</strong></div>
          <div class="map-tooltip-row"><span>Chamados Ativos</span><strong>${b.chamados_ativos}</strong></div>
          ${
            b.chamados_ativos > 0
              ? `<div class="map-compbar" role="img"
                    aria-label="Composição: ${b.criticos} críticos, ${b.atencao} em atenção, ${normais} regulares">
                   <span class="seg seg-criticos" style="width:${pct(b.criticos)}%"></span>
                   <span class="seg seg-atencao" style="width:${pct(b.atencao)}%"></span>
                   <span class="seg seg-normais" style="width:${pct(normais)}%"></span>
                 </div>
                 <div class="map-compbar-caption">
                   <em class="c-crit">${b.criticos} crít.</em> ·
                   <em class="c-aten">${b.atencao} atenção</em> ·
                   <em class="c-norm">${normais} regulares</em>
                 </div>`
              : ''
          }
          ${ofensoresHtml}
        </div>
      `;

      l.unbindTooltip();
      l.bindTooltip(tooltipHtml, {
        sticky: true,
        direction: 'auto',
        className: 'cre-tooltip-custom'
      });

      // Atualiza os event listeners locais para refletir os novos dados
      l.off('mouseover');
      l.off('mouseout');

      l.on('mouseover', () => {
        const currentStyle = getBairroStyle(f, theme, risk);
        l.setStyle({ fillOpacity: currentStyle.fillOpacity + 0.12 });
      });
      l.on('mouseout', () => {
        const currentStyle = getBairroStyle(f, theme, risk);
        l.setStyle({ fillOpacity: currentStyle.fillOpacity });
      });
    });

    // Ponto único de sincronização do estado visual derivado de dados:
    // classes + aria-label
    Object.entries(layersRef.current).forEach(([norm, layer]) => {
      const el = layer.getElement && layer.getElement();
      if (!el) return;
      const b = risk[norm];
      el.classList.toggle('is-critico', Boolean(b && b.temCritico));
      el.setAttribute(
        'aria-label',
        b
          ? `${b.nome_exibicao}: nível ${rotuloNivel(b.nivel)}, ${b.chamados_ativos} chamados ativos, ${b.criticos} críticos`
          : 'Bairro sem cobertura cadastrada'
      );
    });

    renderTopLabels(); // rótulos acompanham os dados (criação e atualização)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risk, theme]);

  // 4. Efeito de Realce e Foco por Polígono da Escola Selecionada (Consulta Rápida)
  useEffect(() => {
    if (
      !mapRef.current ||
      !geoJsonRef.current ||
      !selectedSchool ||
      !elRef.current?.isConnected ||
      !mapRef.current._loaded
    )
      return;

    try {
      const schoolBairro = selectedSchool.bairro;
      if (!schoolBairro) return;

      const normalized = normalizeString(schoolBairro);
      const layer = layersRef.current[normalized];

      if (layer && mapRef.current && geoJsonRef.current) {
        geoJsonRef.current.eachLayer((lyr) => {
          try {
            geoJsonRef.current.resetStyle(lyr);
          } catch (err) {
            console.warn('Leaflet: erro ao resetar estilo da camada', err);
          }
        });

        layer.setStyle({
          weight: 3.5,
          color: 'hsl(175, 80%, 40%)',
          fillOpacity: 0.35
        });

        mapRef.current.fitBounds(layer.getBounds(), { padding: [40, 40] });
      }
    } catch (e) {
      console.warn('Leaflet: Erro no realce da escola selecionada:', e);
    }
  }, [selectedSchool]);

  // 5. Efeito de Foco Territorial por Clique no Card Lateral de Detalhes
  useEffect(() => {
    if (
      !mapRef.current ||
      !geoJsonRef.current ||
      !focusedBairro ||
      !elRef.current?.isConnected ||
      !mapRef.current._loaded
    )
      return;

    try {
      const normalized = focusedBairro.name;
      const layer = layersRef.current[normalized];

      if (layer && mapRef.current && geoJsonRef.current) {
        geoJsonRef.current.eachLayer((lyr) => {
          try {
            geoJsonRef.current.resetStyle(lyr);
          } catch (err) {
            console.warn('Leaflet: erro ao resetar estilo da camada', err);
          }
        });

        layer.setStyle({
          weight: 3.5,
          color: 'hsl(175, 80%, 40%)',
          fillOpacity: 0.35
        });

        mapRef.current.flyToBounds(layer.getBounds(), { padding: [40, 40], duration: 1.2 });
      }
    } catch (e) {
      console.warn('Leaflet: Erro no foco territorial do bairro:', e);
    }
  }, [focusedBairro]);

  return (
    <div
      ref={elRef}
      className="op-map"
      role="img"
      aria-label="Mapa Operacional por bairro da 3ª CRE. Exibe a severidade e os chamados agregados."
    />
  );
}
