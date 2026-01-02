interface TleElementDetailsProps {
  title: string
  color: string | null
}

export const TleElementDetails = ({ title, color }: TleElementDetailsProps) => {
  const squareStyle = {
    width: 16,
    height: 16,
    backgroundColor: color || 'transparent',
    marginRight: 10,
  }

  return (
    <div className="element-detail">
      <div className="d-flex align-items-center">
        <div style={squareStyle} />
        <span className="element-title">{title}</span>
      </div>
    </div>
  )
}
