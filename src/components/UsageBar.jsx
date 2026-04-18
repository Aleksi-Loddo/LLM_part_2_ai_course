/**
 * Displays eldritch energy usage (tokens) and the literal cost of your madness.
 */
export default function UsageBar({ usage }) {
  const { input_tokens, output_tokens, cost } = usage // Backend uses 'cost' now

  return (
    <div className="usage-bar">
      <span>
        <strong>Essence:</strong> {input_tokens.toLocaleString()} sacrifice / {output_tokens.toLocaleString()} manifest
      </span>
      <span>
        <strong>Price of Madness:</strong> ${cost ? cost.toFixed(6) : "0.000000"}
      </span>
    </div>
  )
}