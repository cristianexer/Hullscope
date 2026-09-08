/** Hardware vendors also appear behind ANGLE: only explicit software drivers qualify. */
export function isSoftwareRenderer(renderer:string): boolean {
 return /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render driver/i.test(renderer);
}
