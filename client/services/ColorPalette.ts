const palette = [
  '#74BD8C',
  '#fc8080',
  '#fdbc3a',
  '#f2d3d9',
  '#b3b6c5'
]

export const getColor = (index: number): string => {

  if (palette[index] !== undefined) {
    return palette[index]
  }

  return '#74BD8C';
}
