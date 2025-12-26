export default function VerificationPage() {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Email Verification</h2>
      <p className="text-gray-600">
        Email verification is currently not enabled. You can log in directly with your email and password.
      </p>
      <div className="mt-6">
        <a
          href="/auth/login"
          className="text-blue-600 hover:underline"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
