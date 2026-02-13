import { useState, useMemo } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers, useUpdateUserStatus, useUpdateUserRole } from '@/hooks/useUsers';
import { format } from 'date-fns';

const roleDisplayNames: Record<string, string> = {
  admin: 'Admin',
  user: 'User',
  manager: 'Manager',
  maintenance: 'Maintenance',
};

export default function UserManagementTab() {
  const { data: users, isLoading } = useUsers();
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.role && user.role.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    updateStatus.mutate({ userId, isActive: !currentStatus });
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
    updateRole.mutate({ userId, role: newRole });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">User Management</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Role</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Last Login</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || 'Unnamed User'}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {roleDisplayNames[user.role || 'user'] || user.role}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login
                        ? format(new Date(user.last_login), 'd/M/yyyy, h:mm:ss a')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleStatus(user.user_id, user.is_active)}>
                            {user.is_active ? 'Disable User' : 'Enable User'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRoleChange(user.user_id, 'admin')}>
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.user_id, 'user')}>
                            Set as User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
