/**
 * Canvas utility helpers for cubic Bezier wires and port math
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates cubic bezier SVG path between two points with horizontal curvature
 */
export function getBezierPath(
  source: Point,
  target: Point,
  curvature: number = 0.5
): string {
  const dx = Math.abs(target.x - source.x);
  const offset = Math.max(dx * curvature, 40);

  const cx1 = source.x + offset;
  const cy1 = source.y;
  const cx2 = target.x - offset;
  const cy2 = target.y;

  return `M ${source.x} ${source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${target.x} ${target.y}`;
}

/**
 * Returns exact port center coordinates relative to canvas origin
 * Node dimensions: standard width = 240px, header ~44px, row per port ~24px
 */
export function getPortCoordinates(
  nodePosition: Point,
  nodeWidth: number,
  portType: 'input' | 'output',
  portIndex: number,
  totalPorts: number
): Point {
  const headerHeight = 44;
  const portItemHeight = 26;
  const startY = nodePosition.y + headerHeight + 14 + (portIndex * portItemHeight);

  if (portType === 'input') {
    return {
      x: nodePosition.x,
      y: startY
    };
  } else {
    return {
      x: nodePosition.x + nodeWidth,
      y: startY
    };
  }
}
