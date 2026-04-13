import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, X, ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';

interface KnowledgeGraphViewProps {
  entities: any[];
  events: any[];
  people: any[];
  places: any[];
  onSelectEntity?: (entity: any) => void;
}

interface Node {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  data: any;
}

interface Link {
  source: string;
  target: string;
  strength: number;
}

export default function KnowledgeGraphView({
  entities,
  onSelectEntity
}: KnowledgeGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Color scheme for entity types
  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('event')) return '#3B82F6';
    if (t.includes('person')) return '#10B981';
    if (t.includes('place')) return '#F59E0B';
    if (t.includes('teaching')) return '#EC4899';
    if (t.includes('institution')) return '#8B5CF6';
    if (t.includes('community')) return '#6366F1';
    if (t.includes('concept')) return '#14B8A6';
    if (t.includes('document')) return '#6B7280';
    return '#9CA3AF';
  };

  // Initialize nodes and links
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sample nodes (limit for performance)
    const sampleSize = 100;
    const sampledEntities = entities.slice(0, sampleSize);

    const newNodes: Node[] = sampledEntities.map((entity, index) => {
      const type = entity.node_type || 'Unknown';
      const name = (entity as any).name ||
                   entity.extracted_data?.name ||
                   entity.extracted_data?.event ||
                   entity.extracted_data?.teaching ||
                   entity.passage?.substring(0, 30) ||
                   'Entity';

      // Position in a spiral
      const angle = (index / sampledEntities.length) * Math.PI * 2 * 3;
      const radius = 50 + (index / sampledEntities.length) * 200;

      return {
        id: `node-${index}`,
        label: name,
        type,
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        radius: type.toLowerCase().includes('person') ? 12 : 8,
        color: getTypeColor(type),
        data: entity
      };
    });

    // Create links based on shared passages
    const newLinks: Link[] = [];
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const nodeA = newNodes[i];
        const nodeB = newNodes[j];

        // Check if entities share content
        const passageA = nodeA.data.passage || '';
        const passageB = nodeB.data.passage || '';

        // Simple similarity check
        if (passageA && passageB && passageA.length > 0 && passageB.length > 0) {
          const wordsA = new Set<string>(passageA.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
          const wordsB = new Set<string>(passageB.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));

          const intersection = Array.from(wordsA).filter(w => wordsB.has(w));
          const similarity = intersection.length / Math.min(wordsA.size, wordsB.size);

          if (similarity > 0.3) {
            newLinks.push({
              source: nodeA.id,
              target: nodeB.id,
              strength: similarity
            });
          }
        }
      }
    }

    setNodes(newNodes);
    setLinks(newLinks.slice(0, 150)); // Limit links for performance
  }, [entities]);

  // Apply force-directed layout
  useEffect(() => {
    if (nodes.length === 0) return;

    const iterations = 50;
    const repulsion = 500;
    const attraction = 0.01;

    let currentNodes = [...nodes];

    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const dx = currentNodes[j].x - currentNodes[i].x;
          const dy = currentNodes[j].y - currentNodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);

          currentNodes[i].x -= (dx / dist) * force;
          currentNodes[i].y -= (dy / dist) * force;
          currentNodes[j].x += (dx / dist) * force;
          currentNodes[j].y += (dy / dist) * force;
        }
      }

      // Attraction along links
      links.forEach(link => {
        const sourceNode = currentNodes.find(n => n.id === link.source);
        const targetNode = currentNodes.find(n => n.id === link.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          sourceNode.x += dx * attraction;
          sourceNode.y += dy * attraction;
          targetNode.x -= dx * attraction;
          targetNode.y -= dy * attraction;
        }
      });

      // Center gravity
      const centerX = (canvasRef.current?.width || 800) / 2;
      const centerY = (canvasRef.current?.height || 600) / 2;

      currentNodes.forEach(node => {
        node.x += (centerX - node.x) * 0.01;
        node.y += (centerY - node.y) * 0.01;
      });
    }

    setNodes(currentNodes);
  }, [links]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw links
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = `rgba(219, 198, 112, ${link.strength * 0.5})`;
        ctx.lineWidth = link.strength * 2;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      // Skip filtered nodes
      if (filter !== 'all' && !node.type.toLowerCase().includes(filter)) return;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Node border
      ctx.strokeStyle = node === selectedNode ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = node === selectedNode ? 3 : 1;
      ctx.stroke();

      // Node glow for selected
      if (node === selectedNode) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [nodes, links, zoom, pan, selectedNode, filter]);

  // Mouse handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius + 5;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (onSelectEntity) {
        onSelectEntity(clickedNode.data);
      }
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  // Get entity type counts
  const typeCounts = entities.reduce((acc, entity) => {
    const type = entity.node_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full overflow-hidden bg-ink-500 relative">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
          className="p-2 bg-parchment-100/90 border border-gold-400/40 rounded-lg shadow-lg"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5 text-ink-200" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
          className="p-2 bg-parchment-100/90 border border-gold-400/40 rounded-lg shadow-lg"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5 text-ink-200" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-2 bg-parchment-100/90 border border-gold-400/40 rounded-lg shadow-lg"
          title="Reset view"
        >
          <Maximize2 className="w-5 h-5 text-ink-200" />
        </motion.button>
      </div>

      {/* Filter panel */}
      <div className="absolute top-4 left-4 bg-parchment-100/90 backdrop-blur-sm border border-gold-400/40 rounded-lg p-4 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gold-700" />
          <span className="font-subheading text-sm text-ink-200">Filter by Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full font-subheading transition-all ${
              filter === 'all'
                ? 'bg-gold-500 text-ink-200'
                : 'bg-gold-400/20 text-gold-700 hover:bg-gold-400/30'
            }`}
          >
            All ({entities.length})
          </button>
          {Object.entries(typeCounts)
            .sort(([, a], [, b]) => (Number(a) || 0) - (Number(b) || 0))
            .reverse()
            .slice(0, 6)
            .map(([type, count]) => (
              <button
                key={type}
                onClick={() => setFilter(type.toLowerCase())}
                className={`px-3 py-1 text-xs rounded-full font-subheading transition-all ${
                  filter === type.toLowerCase()
                    ? 'bg-gold-500 text-ink-200'
                    : 'bg-gold-400/20 text-gold-700 hover:bg-gold-400/30'
                }`}
              >
                {String(type)} ({String(count)})
              </button>
            ))}
        </div>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 max-w-md bg-parchment-100/95 backdrop-blur-sm border border-gold-400/50 rounded-lg p-5 shadow-ornate z-20"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="px-2 py-1 text-xs font-subheading uppercase rounded-full" style={{ backgroundColor: `${selectedNode.color}30`, color: selectedNode.color }}>
              {selectedNode.type}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-gold-400/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-parchment-400" />
            </button>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink-200 mb-2">
            {selectedNode.label}
          </h3>
          {selectedNode.data.passage && (
            <p className="font-body text-sm text-ink-100 line-clamp-3">
              {selectedNode.data.passage.substring(0, 150)}...
            </p>
          )}
        </motion.div>
      )}

      {/* Legend - move to bottom right, hidden when node is selected */}
      {!selectedNode && (
        <div className="absolute bottom-4 right-4 bg-parchment-100/90 backdrop-blur-sm border border-gold-400/30 rounded-lg p-3 shadow-lg z-10">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-gold-700" />
            <span className="font-subheading text-xs text-ink-200">Legend</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              { type: 'Events', color: '#3B82F6' },
              { type: 'People', color: '#10B981' },
              { type: 'Places', color: '#F59E0B' },
              { type: 'Teachings', color: '#EC4899' },
              { type: 'Institutions', color: '#8B5CF6' },
              { type: 'Communities', color: '#6366F1' }
            ].map(({ type, color }) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-body text-xs text-ink-200">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center" style={{ opacity: nodes.length > 0 ? 0 : 1 }}>
        <Network className="w-16 h-16 text-gold-400/50 mx-auto mb-4" />
        <p className="font-subheading text-parchment-300">Loading Knowledge Graph...</p>
      </div>
    </div>
  );
}
