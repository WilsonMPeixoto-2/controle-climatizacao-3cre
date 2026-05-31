import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import creBairros from '../data/cre-bairros.geo.json';
import { normalizeString, aggregateBairroStats } from '../lib/logic.js';

const TOP6 = ['inhauma', 'engenho de dentro', 'lins de vasconcelos', 'piedade', 'engenho novo', 'bonsucesso'];

export default function OperationalMap({ tickets, schools, selectedSchool, theme, onSelectBairro }) {
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
      scrollWheelZoom: false, // Não sequestra o scroll da página
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

    // Função de estilo dinâmico coroplético (Situação do Bairro)
    function getBairroStyle(feature) {
      const nm = feature.properties?.NOME || '';
      const normalized = normalizeString(nm);
      const bairroData = stats[normalized];

      let color = 'hsl(215, 12%, 52%)'; // Cinza discreto default (sem chamados ativos)
      let fillOpacity = 0.08;

      if (bairroData && bairroData.chamados_ativos > 0) {
        if (bairroData.criticos > 0) {
          color = 'hsl(350, 72%, 48%)'; // Vermelho discreto para críticos
          fillOpacity = 0.22;
        } else if (bairroData.atencao > 0) {
          color = 'hsl(38, 92%, 50%)'; // Âmbar discreto para atenção
          fillOpacity = 0.18;
        } else {
          color = 'hsl(201, 80%, 52%)'; // Ciano discreto para ativos sem alerta
          fillOpacity = 0.14;
        }
      }

      return {
        color: color,
        weight: 1.4,
        opacity: 0.95,
        fillColor: color,
        fillOpacity: fillOpacity,
      };
    }

    // Instancia camada GeoJSON
    const geoJson = L.geoJSON(creBairros, {
      className: 'cre-glow',
      style: getBairroStyle,
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
        
        // TOP 6 bairros mantêm rótulo permanente minimalista, outros têm hover dinâmico
        if (TOP6.includes(normalized)) {
          l.bindTooltip(nm, { permanent: true, direction: 'center', className: 'cre-label' });
        } else {
          l.bindTooltip(tooltipHtml, { sticky: true, direction: 'auto', className: 'cre-tooltip-custom' });
        }

        // Interação hover local (alteração visual)
        l.on('mouseover', () => {
          const currentStyle = getBairroStyle(f);
          l.setStyle({ fillOpacity: currentStyle.fillOpacity + 0.12 });
        });
        l.on('mouseout', () => {
          const currentStyle = getBairroStyle(f);
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
    map.setMaxBounds(geoJson.getBounds().pad(0.8));

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
  }, [tickets, schools]); // Recria o mapa se a listagem mudar (ex: novas inclusões)

  // 3. Efeito Reativo de Troca de Tema (Atualiza tiles sem destruir o mapa)
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const isDark = theme === 'dark';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

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

  return (
    <div 
      ref={elRef} 
      className="op-map" 
      role="img" 
      aria-label="Mapa Operacional por bairro da 3ª CRE. Exibe a severidade acumulada e os chamados agregados de cada bairro atendido." 
    />
  );
}
