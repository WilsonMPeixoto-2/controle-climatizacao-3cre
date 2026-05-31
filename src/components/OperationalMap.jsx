import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import creBairros from '../data/cre-bairros.geo.json';

/**
 * Mapa Operacional — mapa-base REAL (CARTO dark) com os 26 bairros da 3ª CRE
 * destacados por cima. É um mapa de CONTEXTO da área de atuação (Zona Norte),
 * não um GIS: não plota unidades individualmente (a base não tem coordenadas e
 * mapear o parque é escopo da CTO). Os números reais vivem nos cards/legenda.
 *
 * Os 6 maiores bairros (por nº de escolas) recebem rótulo permanente. A lista é
 * fixa porque a área de atuação não muda — evita depender do carregamento async.
 */
const TOP6 = ['inhauma', 'engenho de dentro', 'lins de vasconcelos', 'piedade', 'engenho novo', 'bonsucesso'];
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

export default function OperationalMap() {
  const elRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !elRef.current) return;

    const map = L.map(elRef.current, {
      center: [-22.88, -43.28], // Zona Norte — fallback antes do fitBounds (evita flash no oceano)
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false, // não sequestra o scroll da página
      attributionControl: true,
    });
    mapRef.current = map;

    // dark_nolabels: mantém ruas/quadras reais mas SEM a toponímia do CARTO,
    // para não competir com os nossos rótulos de bairro.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© OpenStreetMap · © CARTO',
    }).addTo(map);

    const layer = L.geoJSON(creBairros, {
      className: 'cre-glow', // alvo do halo ciano (escopado, não afeta outros overlays)
      style: {
        color: 'hsl(201 90% 66%)',
        weight: 1.4,
        opacity: 0.95,
        fillColor: 'hsl(201 80% 52%)',
        fillOpacity: 0.14,
      },
      onEachFeature: (f, l) => {
        const nm = f.properties?.NOME || '';
        if (TOP6.includes(norm(nm))) {
          l.bindTooltip(nm, { permanent: true, direction: 'center', className: 'cre-label' });
        }
        l.on('mouseover', () => l.setStyle({ fillOpacity: 0.28 }));
        l.on('mouseout', () => l.setStyle({ fillOpacity: 0.14 }));
      },
    }).addTo(map);

    map.fitBounds(layer.getBounds(), { padding: [22, 22] });
    map.setMaxBounds(layer.getBounds().pad(0.8));

    // O container pode montar durante uma transição de layout; recalcula o tamanho.
    const t = setTimeout(() => map.invalidateSize(), 80);

    return () => { clearTimeout(t); map.remove(); mapRef.current = null; };
  }, []);

  return <div ref={elRef} className="op-map" role="img" aria-label="Mapa da área de atuação da 3ª CRE (Zona Norte do Rio de Janeiro), com os bairros atendidos destacados." />;
}
