import { useEffect, useRef } from 'react';
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
    // Tema Claro: Paleta Premium Sólida de Alto Contraste e Elegância Editorial
    color = '#9AAFC4'; // Contorno cinza-azulado suave e uniforme sugerido
    fillColor = '#DCE7F2'; // Neutro/Sem chamados: azul-acinzentado muito claro
    fillOpacity = 0.90;
    weight = 1.0;

    if (bairroData && bairroData.chamados_ativos > 0) {
      if (bairroData.criticos > 0) {
        fillColor = '#E76E6A'; // Crítico / atenção especial: vermelho coral premium
        fillOpacity = 0.95;
        weight = 1.8;
      } else if (bairroData.atencao > 0) {
        fillColor = '#E9B95B'; // Orçamento / atenção: âmbar suave elegante
        fillOpacity = 0.92;
        weight = 1.6;
      } else {
        fillColor = '#5DA9E9'; // Triagem / execução: azul claro vivo e legível
        fillOpacity = 0.90;
        weight = 1.4;
      }
    }
  }

  return {
    color: color,
    weight: weight,
    opacity: 0.95,
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

  // 1. Calcula estatísticas agregadas por bairro usando a lógica pura
  const stats = aggregateBairroStats(tickets, schools);

  // 2. Efeito de Inicialização do Mapa
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
            interactive: false // Não intercepta cliques ou hovers, permitindo que a camada GeoJSON embaixo funcione normalmente
          });
          labelMarker.bindTooltip(nm, { permanent: true, direction: 'center', className: 'cre-label' });
          labelMarker.addTo(map);
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
    map.setMaxBounds(geoJson.getBounds().pad(2.5)); // Limites expandidos para permitir navegação livre e sem travamentos rígidos

    // Corrige renderizações tardias do container CSS
    const t = setTimeout(() => map.invalidateSize(), 80);

    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      geoJsonRef.current = null;
      layersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, schools, theme]); // Recria o mapa se a listagem ou tema inicial mudar

  // 3. Efeito Reativo de Troca de Tema (Atualiza tiles e estilos dos polígonos de forma dinâmica)
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const isDark = theme === 'dark';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

    tileLayerRef.current.setUrl(tileUrl);

    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle((f) => getBairroStyle(f, theme, stats));
    }
  }, [theme, stats]);

  // 4. Efeito de Realce e Foco por Polígono da Escola Selecionada (Consulta Rápida)
  useEffect(() => {
    if (!mapRef.current || !geoJsonRef.current || !selectedSchool) return;

    const schoolBairro = selectedSchool.bairro;
    if (!schoolBairro) return;

    const normalized = normalizeString(schoolBairro);
    const layer = layersRef.current[normalized];

    if (layer) {
      // Reseta os estilos anteriores de todas as camadas
      geoJsonRef.current.eachLayer((lyr) => {
        geoJsonRef.current.resetStyle(lyr);
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
  }, [selectedSchool]);

  // 5. Efeito de Foco Territorial por Clique no Card Lateral de Detalhes
  useEffect(() => {
    if (!mapRef.current || !geoJsonRef.current || !focusedBairro) return;

    const normalized = focusedBairro.name;
    const layer = layersRef.current[normalized];

    if (layer) {
      // Reseta os estilos anteriores de todas as camadas
      geoJsonRef.current.eachLayer((lyr) => {
        geoJsonRef.current.resetStyle(lyr);
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
