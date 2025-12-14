export default function ProgressSteps({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto pb-2">
      <div className="flex items-center px-2">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-colors text-sm sm:text-base ${
                  currentStep === step.number
                    ? 'bg-blue-600 text-white'
                    : currentStep > step.number
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {currentStep > step.number ? (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-gray-600 whitespace-nowrap max-w-[60px] sm:max-w-none text-center leading-tight">
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-8 sm:w-12 md:w-16 mx-1 sm:mx-2 transition-colors flex-shrink-0 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
