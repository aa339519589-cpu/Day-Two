import { useParams } from 'react-router-dom'
import { PhotoStream } from '../components/PhotoStream'
export function FeedPage() {
  const { personId = '' } = useParams()
  return <PhotoStream personId={personId} key={personId}/>
}
