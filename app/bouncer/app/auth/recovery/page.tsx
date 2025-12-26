export default function RecoveryPage() {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Password Recovery</h2>
      <p className="text-gray-600 mb-4">
        Password recovery is not yet implemented. Please contact support if you
        need to reset your password.
      </p>
      <div className="mt-6">
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Back to Login
        </a>
      </div>
    </div>
  );
}
