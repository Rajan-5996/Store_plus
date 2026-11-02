const FIGURE = /(₹[\d,.]+(?:Cr|L|K)?|~?\d[\d,.]*%?|#\d{3})/g

/** Text with its figures (rupees, percentages, store codes, counts) set in bold so the numbers stand out. */
export default function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(FIGURE).map((part, i) =>
        i % 2 === 1 ? (
          <b key={i} className="rec-em font-bold">
            {part}
          </b>
        ) : (
          part
        ),
      )}
    </>
  )
}
