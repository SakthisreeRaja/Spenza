import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Add logic here to check if user is logged in
  // For now, always redirect to LoginPage
  const isLoggedIn = false; // This will be replaced with actual auth check
  
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/LoginPage" />;
}
