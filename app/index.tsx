import { Redirect } from 'expo-router';

export default function Index() {
  // Always start with splash screen
  return <Redirect href="/splash" />;
}
