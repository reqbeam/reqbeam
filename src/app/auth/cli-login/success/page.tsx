'use client'

export default function CliLoginSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e]">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Login Successful!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You can close this window and return to your CLI.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          The CLI should automatically detect your authentication.
        </p>
      </div>
    </div>
  )
}

