// TODO: In the future, we should implement a recovery flow with an OTP via email.
// This would allow users to recover their account by verifying their email address
// and receiving a one-time password to authenticate and create a new passkey.

export default function RecoveryPage() {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Passkey Recovery</h2>
      <p className="text-gray-600 mb-4">
        Since we use passkeys for authentication, there are no passwords to
        recover. If you&apos;ve lost access to your passkey, you can create a
        new one by signing in with an existing passkey or registering a new
        account.
      </p>
      <p className="text-gray-600 mb-4">
        Passkeys are managed by your device&apos;s operating system. You can
        view and manage your passkeys in your device settings:
      </p>
      <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
        <li>
          <strong>iOS/macOS:</strong> Settings → Passwords → Security Keys
        </li>
        <li>
          <strong>Android:</strong> Settings → Security → Passkeys
        </li>
        <li>
          <strong>Windows:</strong> Settings → Accounts → Passkeys
        </li>
      </ul>
      <div className="mt-6 space-y-2">
        <a href="/auth/login" className="block text-blue-600 hover:underline">
          Back to Login
        </a>
        <a
          href="/auth/registration"
          className="block text-blue-600 hover:underline"
        >
          Create New Account
        </a>
      </div>
    </div>
  );
}
