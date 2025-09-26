import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function ProfileCard() {
  const { user } = useAuth();

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center space-x-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.avatar_url} alt={user?.name || "User"} />
          <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{user?.name || "No Name"}</p>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-sm mt-2">Type: {user?.userType || "N/A"}</p>
          {/* Add more profile fields as needed */}
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm">Edit Profile</Button>
        </div>
      </CardContent>
    </Card>
  );
}
