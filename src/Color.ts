export class Color {
  r: number
  g: number
  b: number

  /**
   * Creates a new instance of the Color class.
   * @param r The red component (0 - 255)
   * @param g The green component (0 - 255)
   * @param b The blue component (0 - 255)
   * @throws {RangeError} if r, g, or b are outside the range 0-255
   */
  constructor(r: number, g: number, b: number) {
    console.log(`Color(${r}, ${g}, ${b}) has been called`)

    if (r < 0 || 255 < r || g < 0 || 255 < g || b < 0 || 255 < b) {
      throw new RangeError('RGB values must be in the range 0-255')
    }
    this.r = Math.round(r)
    this.g = Math.round(g)
    this.b = Math.round(b)
  }

  /**
   * Retrieve the color in RGB format.
   * @returns {[number, number, number]} The color in RGB format
   */
  rgb(): number[] {
    return [this.r, this.g, this.b]
  }

  /**
   * Retrieve the color in HEX format.
   * @returns {string} The color in HEX format
   */
  hex(): string {
    const hexR = this.r.toString(16).padStart(2, '0')
    const hexG = this.g.toString(16).padStart(2, '0')
    const hexB = this.b.toString(16).padStart(2, '0')
    return `#${hexR}${hexG}${hexB}`
  }

  /**
   * Retrieve the color in CIELAB format.
   * @returns {[number, number, number]} The color in CIELAB format
   */
  lab(): [number, number, number] {
    let r = this.r / 255
    let g = this.g / 255
    let b = this.b / 255

    r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92
    g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92
    b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92

    const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
    const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0
    const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883

    const toLab = (v: number) => (v > 0.008856 ? Math.cbrt(v) : (v * 903.3 + 16) / 116)
    const l = 116 * toLab(y) - 16
    const a = 500 * (toLab(x) - toLab(y))
    const bb = 200 * (toLab(y) - toLab(z))

    return [l, a, bb]
  }
}
