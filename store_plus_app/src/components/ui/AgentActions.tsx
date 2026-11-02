import { useActions } from '@/hooks/useActions'
import ActionsList, { RefreshButton, isLoading } from './ActionsList'
import Box from './Box'

interface Props {
  scope: string
  title?: string
  /** Beside a chart: match the neighbour's height and scroll inside instead of stretching the row. */
  fill?: boolean
}

/** The page's "Recommended actions" box, written by the Pulse agent from the same numbers the page shows. */
export default function AgentActions({ scope, title = 'Recommended actions', fill }: Props) {
  const { entry, reload, retry } = useActions(scope)
  const header = (
    <span className="flex items-center gap-2">
      {title}
      <RefreshButton loading={isLoading(entry)} onClick={reload} />
    </span>
  )
  return (
    <Box title={header} className={fill ? 'rec-box fill-col' : 'rec-open'}>
      <div className={fill ? 'fill-scroll' : ''}>
        <ActionsList entry={entry} retry={retry} columns={!fill} />
      </div>
    </Box>
  )
}
