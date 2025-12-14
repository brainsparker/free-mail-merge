import { AppProvider, useWizardNavigation } from './context/AppContext';
import ProgressSteps from './components/ui/ProgressSteps';
import Button from './components/ui/Button';
import CSVImportStep from './features/csv-import/CSVImportStep';
import ColumnMappingStep from './features/column-mapping/ColumnMappingStep';
import LabelFormatStep from './features/label-format/LabelFormatStep';
import OutputStep from './features/output/OutputStep';
import './index.css';

const WIZARD_STEPS = [
  { number: 1, label: 'Upload CSV', component: CSVImportStep },
  { number: 2, label: 'Map Columns', component: ColumnMappingStep },
  { number: 3, label: 'Select Format', component: LabelFormatStep },
  { number: 4, label: 'Download', component: OutputStep }
];

function WizardContent() {
  const { currentStep, nextStep, prevStep, canGoNext, resetWizard } = useWizardNavigation();

  const CurrentStepComponent = WIZARD_STEPS.find(s => s.number === currentStep)?.component || CSVImportStep;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">LabelMerge</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Free, privacy-first CSV to label printing</p>
            </div>
            {currentStep > 1 && (
              <Button variant="ghost" onClick={resetWizard} className="text-sm">
                Start Over
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-8">
        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} steps={WIZARD_STEPS} />

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[400px]">
          <CurrentStepComponent />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex-1 sm:flex-none"
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={nextStep}
            disabled={!canGoNext() || currentStep === 4}
            className="flex-1 sm:flex-none"
          >
            {currentStep === 4 ? 'Done' : 'Next'}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-gray-600 text-sm">
        <p>
          All data processed locally in your browser. No uploads, no tracking.
        </p>
        <p className="mt-2">
          <a
            href="https://github.com/briansparker/free-mail-merge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <WizardContent />
    </AppProvider>
  );
}
