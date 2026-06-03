import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import creBairros from '../data/cre-bairros.geo.json';
import { normalizeString, aggregateBairroStats } from '../lib/logic.js';

const TOP6 = ['inhauma', 'engenho de dentro', 'lins de vasconcelos', 'piedade', 'engenho novo', 'bonsucesso'];

// Função pura de estilo coroplético baseada no tema e nas estatísticas
function getBairroStyle(feature, theme, stats) {
  const nm = feature.properties?.NOME || '';
  const normalized = normalizeString(nm);
  const bairroData = stats[normalized];
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

    if (bairroData && bairroData.chamados_ativos > 0) {
      if (bairroData.criticos > 0) {
        color = 'hsl(350, 80%, 55%)';
        fillColor = 'hsl(350, 75%, 48%)';
        fillOpacity = 0.26;
        weight = 1.6;
      } else if (bairroData.atencao > 0) {
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
    // Tema Claro: Paleta Premium Cartográfica Translúcida de Alta Fidelidade (Estilo Editorial)
    // Contornos dinâmicos para limites nítidos e ricos entre os bairros (exatamente como no Dark Mode)
    fillOpacity = 0.45; // Translúcido para ver as ruas e detalhes sob os polígonos

    if (bairroData && bairroData.chamados_ativos > 0) {
      if (bairroData.criticos > 0) {
        color = '#D98287'; // Borda vermelha fosca sólida
        fillColor = '#FCE8E6'; // Vermelho translúcido muito suave
        weight = 1.6;
      } else if (bairroData.atencao > 0) {
        color = '#D8B85A'; // Borda amarela fosca sólida
        fillColor = '#FDF6E2'; // Amarelo translúcido muito suave
        weight = 1.4;
      } else {
        color = '#7DAFCC'; // Borda azul fosca sólida
        fillColor = '#EBF3F9'; // Azul translúcido muito suave
        weight = 1.3;
      }
    } else if (bairroData && bairroData.escolas_cadastradas > 0) {
      color = '#6EAD7A'; // Borda verde fosca sólida ("Em dia")
      fillColor = '#EEF7F0'; // Verde translúcido muito suave
      weight = 1.2;
    } else {
      color = 'rgba(148, 163, 184, 0.45)'; // Contorno cinza-azulado levíssimo
      fillColor = 'transparent'; // Sem preenchimento para visual cartográfico limpo
      fillOpacity = 0;
      weight = 0.85;
    }
  }

  return {
    color: color,
    weight: weight,
    opacity: isDark ? 0.95 : 0.85, // strokeOpacity: 0.85 no light mode para contornos nítidos e limpos
    fillColor: fillColor,
    fillOpacity: fillOpacity,
  };
}

export default function OperationalMap({ tickets, schools, selectedSchool, theme, onSelectBairro, focusedBairro }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const geoJsonRef = useRef(null);
  const layersRef = useRef({});
  const labelMarkersRef = useRef([]);

  const stats = useMemo(() => aggregateBairroStats(tickets, schools), [tickets, schools]);

  // 2. Efeito de Inicialização do Mapa (Roda apenas uma vez no mount)
  useEffect(() => {
    if (mapRef.current || !elRef.current) return;

    const map = L.map(elRef.current, {
      center: [-22.88, -43.28], // Zona Norte fallback
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true, // Habilitado para zoom fluido com a roda do mouse
      doubleClickZoom: true, // Habilitado para zoom com duplo clique
      boxZoom: true,
      dragging: true,
      attributionControl: true,
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
      attribution: '© OpenStreetMap · © CARTO',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Instancia camada GeoJSON
    const geoJson = L.geoJSON(creBairros, {
      className: 'cre-glow',
      style: (f) => getBairroStyle(f, theme, stats),
      onEachFeature: (f, l) => {
        const nm = f.properties?.NOME || '';
        const normalized = normalizeString(nm);
        const bairroData = stats[normalized] || { escolas_cadastradas: 0, chamados_ativos: 0, criticos: 0, atencao: 0 };

        // Guarda referência do layer para foco futuro
        layersRef.current[normalized] = l;

        // Tooltip dinâmico rico no hover
        const tooltipHtml = `
          <div class="map-tooltip">
            <div class="map-tooltip-title">${nm}</div>
            <div class="map-tooltip-row"><span>Escolas:</span> <strong>${bairroData.escolas_cadastradas}</strong></div>
            <div class="map-tooltip-row"><span>Chamados Ativos:</span> <strong>${bairroData.chamados_ativos}</strong></div>
            <div class="map-tooltip-row" style="color: var(--color-red); font-weight: bold;"><span>Críticos:</span> <strong>${bairroData.criticos}</strong></div>
            <div class="map-tooltip-row" style="color: var(--color-amber); font-weight: bold;"><span>Atenção:</span> <strong>${bairroData.atencao}</strong></div>
          </div>
        `;
        
        // Todos os bairros mostram o tooltip dinâmico no hover com estatísticas
        l.bindTooltip(tooltipHtml, { sticky: true, direction: 'auto', className: 'cre-tooltip-custom' });

        // Para os TOP 6 bairros, cria um marcador invisível não-interativo no centro do polígono para exibir o nome permanentemente
        if (TOP6.includes(normalized)) {
          const center = l.getBounds().getCenter();
          const labelMarker = L.marker(center, {
            icon: L.divIcon({
              className: 'cre-marker-hidden',
              html: '',
              iconSize: [0, 0]
            }),
            interactive: false // Não intercepta cliques ou hovers
          });
          labelMarker.bindTooltip(nm, { permanent: true, direction: 'center', className: 'cre-label' });
          labelMarker.addTo(map);
          labelMarkersRef.current.push(labelMarker);
        }

        // Interação hover local (alteração visual)
        l.on('mouseover', () => {
          const currentStyle = getBairroStyle(f, theme, stats);
          l.setStyle({ fillOpacity: currentStyle.fillOpacity + 0.12 });
        });
        l.on('mouseout', () => {
          const currentStyle = getBairroStyle(f, theme, stats);
          l.setStyle({ fillOpacity: currentStyle.fillOpacity });
        });

        // Evento de Clique: aciona o callback somente leitura no App.jsx
        l.on('click', () => {
          if (onSelectBairro) {
            onSelectBairro(normalized);
          }
        });
      },
    }).addTo(map);
    geoJsonRef.current = geoJson;

    map.fitBounds(geoJson.getBounds(), { padding: [22, 22] });
    map.setMaxBounds(geoJson.getBounds().pad(2.5)); // Limites expandidos

    // Corrige renderizações tardias do container CSS com segurança
    const t = setTimeout(() => {
      try {
        if (mapRef.current && elRef.current?.isConnected) {
          mapRef.current.invalidateSize();
        }
      } catch (e) {
        console.warn("Leaflet: Erro ao invalidar tamanho no timeout:", e);
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
          console.warn("Leaflet: Erro ao invalidar tamanho no ResizeObserver:", e);
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
          // Fecha tooltip aberto no mapa
          mapRef.current.closeTooltip();
          
          // Limpa marcadores permanentes de bairros e desvincula seus tooltips
          labelMarkersRef.current.forEach((m) => {
            try {
              m.unbindTooltip();
              m.remove();
            } catch {
              // Silencioso
            }
          });
          labelMarkersRef.current = [];

          // Limpa listeners e tooltips de cada polígono GeoJSON
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
          
          mapRef.current.remove();
        } catch (e) {
          console.warn("Leaflet: Erro ao remover mapa no cleanup:", e);
        }
      }
      mapRef.current = null;
      tileLayerRef.current = null;
      geoJsonRef.current = null;
      layersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Inicialização estrita de ciclo único!

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
    geoJsonRef.current.setStyle((f) => getBairroStyle(f, theme, stats));

    // Atualiza os tooltips e comportamentos hover reativos de cada polígono
    geoJsonRef.current.eachLayer((l) => {
      const f = l.feature;
      if (!f) return;
      const nm = f.properties?.NOME || '';
      const normalized = normalizeString(nm);
      const bairroData = stats[normalized] || { escolas_cadastradas: 0, chamados_ativos: 0, criticos: 0, atencao: 0 };

      // Tooltip dinâmico rico atualizado
      const tooltipHtml = `
        <div class="map-tooltip">
          <div class="map-tooltip-title">${nm}</div>
          <div class="map-tooltip-row"><span>Escolas:</span> <strong>${bairroData.escolas_cadastradas}</strong></div>
          <div class="map-tooltip-row"><span>Chamados Ativos:</span> <strong>${bairroData.chamados_ativos}</strong></div>
          <div class="map-tooltip-row" style="color: var(--color-red); font-weight: bold;"><span>Críticos:</span> <strong>${bairroData.criticos}</strong></div>
          <div class="map-tooltip-row" style="color: var(--color-amber); font-weight: bold;"><span>Atenção:</span> <strong>${bairroData.atencao}</strong></div>
        </div>
      `;

      l.unbindTooltip();
      l.bindTooltip(tooltipHtml, { sticky: true, direction: 'auto', className: 'cre-tooltip-custom' });

      // Atualiza os event listeners locais para refletir os novos dados
      l.off('mouseover');
      l.off('mouseout');

      l.on('mouseover', () => {
        const currentStyle = getBairroStyle(f, theme, stats);
        l.setStyle({ fillOpacity: currentStyle.fillOpacity + 0.12 });
      });
      l.on('mouseout', () => {
        const currentStyle = getBairroStyle(f, theme, stats);
        l.setStyle({ fillOpacity: currentStyle.fillOpacity });
      });
    });
  }, [stats, theme]);

  // 4. Efeito de Realce e Foco por Polígono da Escola Selecionada (Consulta Rápida)
  useEffect(() => {
    if (!mapRef.current || !geoJsonRef.current || !selectedSchool || !elRef.current?.isConnected || !mapRef.current._loaded) return;

    try {
      const schoolBairro = selectedSchool.bairro;
      if (!schoolBairro) return;

      const normalized = normalizeString(schoolBairro);
      const layer = layersRef.current[normalized];

      if (layer && mapRef.current && geoJsonRef.current) {
        // Reseta os estilos anteriores de todas as camadas
        geoJsonRef.current.eachLayer((lyr) => {
          try {
            geoJsonRef.current.resetStyle(lyr);
          } catch (err) {
            console.warn("Leaflet: erro ao resetar estilo da camada", err);
          }
        });

        // Aplica realce estrito no polígono do bairro
        layer.setStyle({
          weight: 3.5,
          color: 'hsl(175, 80%, 40%)', // Realce verde-água brilhante
          fillOpacity: 0.35,
        });

        // Dá zoom e centraliza nos limites do polígono geográfico (Sem geocodificar coordenadas da escola)
        mapRef.current.fitBounds(layer.getBounds(), { padding: [40, 40] });
      }
    } catch (e) {
      console.warn("Leaflet: Erro no realce da escola selecionada:", e);
    }
  }, [selectedSchool]);

  // 5. Efeito de Foco Territorial por Clique no Card Lateral de Detalhes
  useEffect(() => {
    if (!mapRef.current || !geoJsonRef.current || !focusedBairro || !elRef.current?.isConnected || !mapRef.current._loaded) return;

    try {
      const normalized = focusedBairro.name;
      const layer = layersRef.current[normalized];

      if (layer && mapRef.current && geoJsonRef.current) {
        // Reseta os estilos anteriores de todas as camadas
        geoJsonRef.current.eachLayer((lyr) => {
          try {
            geoJsonRef.current.resetStyle(lyr);
          } catch (err) {
            console.warn("Leaflet: erro ao resetar estilo da camada", err);
          }
        });

        // Aplica realce estrito no polígono do bairro
        layer.setStyle({
          weight: 3.5,
          color: 'hsl(175, 80%, 40%)', // Realce verde-água brilhante
          fillOpacity: 0.35,
        });

        // Dá zoom e centraliza nos limites do polígono geográfico de forma suave (flyToBounds)
        mapRef.current.flyToBounds(layer.getBounds(), { padding: [40, 40], duration: 1.2 });
      }
    } catch (e) {
      console.warn("Leaflet: Erro no foco territorial do bairro:", e);
    }
  }, [focusedBairro]);

  return (
    <div 
      ref={elRef} 
      className="op-map" 
      role="img" 
      aria-label="Mapa Operacional por bairro da 3ª CRE. Exibe a severidade acumulada e os chamados agregados de cada bairro atendido." 
    />
  );
}
