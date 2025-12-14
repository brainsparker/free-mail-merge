export default function ProgressSteps({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                currentStep === step.number
                  ? 'bg-blue-600 text-white'
                  : currentStep > step.number
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {currentStep > step.number ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs mt-2 text-gray-600 whitespace-nowrap">{step.label}</span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-16 mx-2 transition-colors ${
                currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
