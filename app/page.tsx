// Defense-in-depth fallback. Middleware handles / → /ro before this runs.
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/ro');
}
