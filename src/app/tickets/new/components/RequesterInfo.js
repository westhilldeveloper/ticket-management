export default function RequesterInfo({ user }) {
  if (!user) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500 mb-1">Requested by</p>
        <p className="text-sm font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
    </div>
  );
}