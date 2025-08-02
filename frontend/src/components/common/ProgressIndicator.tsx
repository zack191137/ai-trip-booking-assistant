import React from 'react'
import {
  Box,
  Step,
  Stepper,
  StepLabel,
  Typography,
  LinearProgress,
  StepConnector,
  stepConnectorClasses,
  styled,
} from '@mui/material'
import {
  Check,
  Circle,
  RadioButtonUnchecked,
} from '@mui/icons-material'

interface ProgressStep {
  label: string
  description?: string
  completed?: boolean
  active?: boolean
  error?: boolean
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  orientation?: 'horizontal' | 'vertical'
  variant?: 'stepper' | 'progress-bar' | 'dots'
  showLabels?: boolean
  currentStep?: number
  totalSteps?: number
  progress?: number
}

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.grey[400],
    borderTopWidth: 2,
    borderRadius: 1,
  },
}))

interface CustomStepIconProps {
  active?: boolean
  completed?: boolean
  error?: boolean
  className?: string
}

const CustomStepIcon = (props: CustomStepIconProps) => {
  const { active, completed, error, className } = props


  if (completed) {
    return (
      <Box
        className={className}
        sx={{
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check />
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        className={className}
        sx={{
          color: 'error.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Circle />
      </Box>
    )
  }

  return (
    <Box
      className={className}
      sx={{
        color: active ? 'primary.main' : 'grey.400',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {active ? <Circle /> : <RadioButtonUnchecked />}
    </Box>
  )
}

export function ProgressIndicator({
  steps,
  orientation = 'horizontal',
  variant = 'stepper',
  showLabels = true,
  currentStep,
  totalSteps,
  progress,
}: ProgressIndicatorProps) {
  const renderStepper = () => (
    <Stepper
      activeStep={currentStep}
      orientation={orientation}
      connector={<CustomConnector />}
      sx={{ width: '100%' }}
    >
      {steps.map((step) => (
        <Step key={step.label} completed={step.completed}>
          <StepLabel
            StepIconComponent={CustomStepIcon}
            error={step.error}
            optional={
              step.description && (
                <Typography variant="caption">{step.description}</Typography>
              )
            }
          >
            {showLabels && step.label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  )

  const renderProgressBar = () => (
    <Box sx={{ width: '100%' }}>
      {showLabels && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">
            {currentStep !== undefined && totalSteps !== undefined
              ? `Step ${currentStep + 1} of ${totalSteps}`
              : 'Progress'}
          </Typography>
          <Typography variant="body2">
            {progress !== undefined ? `${Math.round(progress)}%` : ''}
          </Typography>
        </Box>
      )}
      <LinearProgress
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
        sx={{ height: 8, borderRadius: 4 }}
      />
      {showLabels && currentStep !== undefined && steps[currentStep] && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {steps[currentStep].label}
        </Typography>
      )}
    </Box>
  )

  const renderDots = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
      }}
    >
      {steps.map((step) => (
        <Box
          key={step.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexDirection: orientation === 'vertical' ? 'column' : 'row',
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: step.completed
                ? 'primary.main'
                : step.active
                ? 'primary.light'
                : step.error
                ? 'error.main'
                : 'grey.400',
              transition: 'background-color 0.3s ease',
            }}
          />
          {showLabels && (
            <Typography
              variant="caption"
              color={
                step.completed || step.active ? 'text.primary' : 'text.secondary'
              }
            >
              {step.label}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )

  switch (variant) {
    case 'progress-bar':
      return renderProgressBar()
    case 'dots':
      return renderDots()
    case 'stepper':
    default:
      return renderStepper()
  }
}

export default ProgressIndicator