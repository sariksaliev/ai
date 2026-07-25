const ROLES = {
  ceo: {
    name: 'CEO',
    permissions: ['read:all', 'write:all', 'approve:all', 'manage:users', 'manage:agents', 'manage:integrations', 'view:revenue', 'view:forecast', 'view:roi'],
    dashboard: 'executive'
  },
  cro: {
    name: 'CRO',
    permissions: ['read:all', 'write:sales', 'write:marketing', 'approve:sales', 'approve:budget', 'view:revenue', 'view:pipeline', 'view:forecast'],
    dashboard: 'revenue'
  },
  cmo: {
    name: 'CMO',
    permissions: ['read:all', 'write:marketing', 'approve:campaign', 'view:marketing', 'view:analytics'],
    dashboard: 'marketing'
  },
  finance: {
    name: 'Finance',
    permissions: ['read:finance', 'write:finance', 'view:revenue', 'view:forecast', 'view:roi'],
    dashboard: 'finance'
  },
  manager: {
    name: 'Manager',
    permissions: ['read:team', 'write:tasks', 'view:team_metrics'],
    dashboard: 'team'
  },
  member: {
    name: 'Member',
    permissions: ['read:tasks', 'write:tasks', 'view:personal'],
    dashboard: 'personal'
  }
};

const USERS = [
  { id: 'usr_sam', name: 'Sam Azizov', email: 'sam@nimbus.demo', role: 'ceo', avatar: 'SA', department: 'Executive' },
  { id: 'usr_sarah', name: 'Sarah Chen', email: 'sarah@nimbus.demo', role: 'cro', avatar: 'SC', department: 'Sales' },
  { id: 'usr_maya', name: 'Maya Rodriguez', email: 'maya@nimbus.demo', role: 'cmo', avatar: 'MR', department: 'Marketing' },
  { id: 'usr_james', name: 'James Wilson', email: 'james@nimbus.demo', role: 'finance', avatar: 'JW', department: 'Finance' },
  { id: 'usr_alex', name: 'Alex Kim', email: 'alex@nimbus.demo', role: 'manager', avatar: 'AK', department: 'Operations' },
  { id: 'usr_emma', name: 'Emma Thompson', email: 'emma@nimbus.demo', role: 'member', avatar: 'ET', department: 'Sales' }
];

function getUserPermissions(user) {
  const role = ROLES[user.role];
  return role ? role.permissions : ROLES.member.permissions;
}

function canUser(user, permission) {
  const permissions = getUserPermissions(user);
  return permissions.includes(permission) || permissions.includes('write:all') || permissions.includes('read:all');
}

function filterDataByRole(user, data) {
  const role = ROLES[user.role];
  if (!role || role.permissions.includes('read:all')) return data;

  const filtered = { ...data };
  if (!role.permissions.includes('view:revenue')) delete filtered.metrics;
  if (!role.permissions.includes('view:forecast')) delete filtered.forecast;
  if (!role.permissions.includes('view:roi')) delete filtered.roi;

  return filtered;
}

function getTeamMembers(user) {
  if (user.role === 'ceo' || user.role === 'cro') return USERS;
  if (user.role === 'manager') return USERS.filter(u => u.department === user.department || u.role === 'member');
  return [user];
}

module.exports = { ROLES, USERS, getUserPermissions, canUser, filterDataByRole, getTeamMembers };

