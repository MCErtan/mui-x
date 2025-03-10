import * as React from 'react';
import clsx from 'clsx';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { styled, useThemeProps } from '@mui/material/styles';
import {
  unstable_useEnhancedEffect as useEnhancedEffect,
  unstable_composeClasses as composeClasses,
} from '@mui/utils';
import { ClockPointer } from './ClockPointer';
import { useLocaleText, useUtils } from '../internals/hooks/useUtils';
import type { PickerSelectionState } from '../internals/hooks/usePicker';
import { useMeridiemMode } from '../internals/hooks/date-helpers-hooks';
import { getHours, getMinutes } from './shared';
import { TimeView } from '../models';
import { ClockClasses, getClockUtilityClass } from './clockClasses';

export interface ClockProps<TDate> extends ReturnType<typeof useMeridiemMode> {
  ampm: boolean;
  ampmInClock: boolean;
  autoFocus?: boolean;
  children: readonly React.ReactNode[];
  isTimeDisabled: (timeValue: number, type: TimeView) => boolean;
  minutesStep?: number;
  onChange: (value: number, isFinish?: PickerSelectionState) => void;
  /**
   * DOM id that the selected option should have
   * Should only be `undefined` on the server
   */
  selectedId: string | undefined;
  type: TimeView;
  /**
   * The numeric value of the current view.
   */
  viewValue: number;
  /**
   * The current full date value.
   */
  value: TDate | null;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  classes?: Partial<ClockClasses>;
}

const useUtilityClasses = (ownerState: ClockProps<any>) => {
  const { classes } = ownerState;
  const slots = {
    root: ['root'],
    clock: ['clock'],
    wrapper: ['wrapper'],
    squareMask: ['squareMask'],
    pin: ['pin'],
    amButton: ['amButton'],
    pmButton: ['pmButton'],
  };

  return composeClasses(slots, getClockUtilityClass, classes);
};

const ClockRoot = styled('div', {
  name: 'MuiClock',
  slot: 'Root',
  overridesResolver: (_, styles) => styles.root,
})(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: theme.spacing(2),
}));

const ClockClock = styled('div', {
  name: 'MuiClock',
  slot: 'Clock',
  overridesResolver: (_, styles) => styles.clock,
})({
  backgroundColor: 'rgba(0,0,0,.07)',
  borderRadius: '50%',
  height: 220,
  width: 220,
  flexShrink: 0,
  position: 'relative',
  pointerEvents: 'none',
});

const ClockWrapper = styled('div', {
  name: 'MuiClock',
  slot: 'Wrapper',
  overridesResolver: (_, styles) => styles.wrapper,
})({
  '&:focus': {
    outline: 'none',
  },
});

type ClockSquareMaskOwnerState = {
  disabled?: ClockProps<any>['disabled'];
};

const ClockSquareMask = styled('div', {
  name: 'MuiClock',
  slot: 'SquareMask',
  overridesResolver: (_, styles) => styles.squareMask,
})<{ ownerState: ClockSquareMaskOwnerState }>(({ ownerState }) => ({
  width: '100%',
  height: '100%',
  position: 'absolute',
  pointerEvents: 'auto',
  outline: 0,
  // Disable scroll capabilities.
  touchAction: 'none',
  userSelect: 'none',
  ...(ownerState.disabled
    ? {}
    : {
        '@media (pointer: fine)': {
          cursor: 'pointer',
          borderRadius: '50%',
        },
        '&:active': {
          cursor: 'move',
        },
      }),
}));

const ClockPin = styled('div', {
  name: 'MuiClock',
  slot: 'Pin',
  overridesResolver: (_, styles) => styles.pin,
})(({ theme }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: (theme.vars || theme).palette.primary.main,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}));

const ClockAmButton = styled(IconButton, {
  name: 'MuiClock',
  slot: 'AmButton',
  overridesResolver: (_, styles) => styles.amButton,
})<{ ownerState: ClockProps<any> }>(({ theme, ownerState }) => ({
  zIndex: 1,
  position: 'absolute',
  bottom: 8,
  left: 8,
  ...(ownerState.meridiemMode === 'am' && {
    backgroundColor: (theme.vars || theme).palette.primary.main,
    color: (theme.vars || theme).palette.primary.contrastText,
    '&:hover': {
      backgroundColor: (theme.vars || theme).palette.primary.light,
    },
  }),
}));

const ClockPmButton = styled(IconButton, {
  name: 'MuiClock',
  slot: 'PmButton',
  overridesResolver: (_, styles) => styles.pmButton,
})<{ ownerState: ClockProps<any> }>(({ theme, ownerState }) => ({
  zIndex: 1,
  position: 'absolute',
  bottom: 8,
  right: 8,
  ...(ownerState.meridiemMode === 'pm' && {
    backgroundColor: (theme.vars || theme).palette.primary.main,
    color: (theme.vars || theme).palette.primary.contrastText,
    '&:hover': {
      backgroundColor: (theme.vars || theme).palette.primary.light,
    },
  }),
}));

/**
 * @ignore - internal component.
 */
export function Clock<TDate>(inProps: ClockProps<TDate>) {
  const props = useThemeProps({ props: inProps, name: 'MuiClock' });
  const {
    ampm,
    ampmInClock,
    autoFocus,
    children,
    value,
    handleMeridiemChange,
    isTimeDisabled,
    meridiemMode,
    minutesStep = 1,
    onChange,
    selectedId,
    type,
    viewValue,
    disabled,
    readOnly,
    className,
  } = props;

  const ownerState = props;

  const utils = useUtils<TDate>();
  const localeText = useLocaleText<TDate>();
  const isMoving = React.useRef(false);
  const classes = useUtilityClasses(ownerState);

  const isSelectedTimeDisabled = isTimeDisabled(viewValue, type);
  const isPointerInner = !ampm && type === 'hours' && (viewValue < 1 || viewValue > 12);

  const handleValueChange = (newValue: number, isFinish: PickerSelectionState) => {
    if (disabled || readOnly) {
      return;
    }
    if (isTimeDisabled(newValue, type)) {
      return;
    }

    onChange(newValue, isFinish);
  };

  const setTime = (event: MouseEvent | React.TouchEvent, isFinish: PickerSelectionState) => {
    let { offsetX, offsetY } = event as MouseEvent;

    if (offsetX === undefined) {
      const rect = ((event as React.TouchEvent).target as HTMLElement).getBoundingClientRect();

      offsetX = (event as React.TouchEvent).changedTouches[0].clientX - rect.left;
      offsetY = (event as React.TouchEvent).changedTouches[0].clientY - rect.top;
    }

    const newSelectedValue =
      type === 'seconds' || type === 'minutes'
        ? getMinutes(offsetX, offsetY, minutesStep)
        : getHours(offsetX, offsetY, Boolean(ampm));

    handleValueChange(newSelectedValue, isFinish);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    isMoving.current = true;
    setTime(event, 'shallow');
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (isMoving.current) {
      setTime(event, 'finish');
      isMoving.current = false;
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // event.buttons & PRIMARY_MOUSE_BUTTON
    if (event.buttons > 0) {
      setTime(event.nativeEvent, 'shallow');
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (isMoving.current) {
      isMoving.current = false;
    }

    setTime(event.nativeEvent, 'finish');
  };

  const hasSelected = React.useMemo(() => {
    if (type === 'hours') {
      return true;
    }

    return viewValue % 5 === 0;
  }, [type, viewValue]);

  const keyboardControlStep = type === 'minutes' ? minutesStep : 1;

  const listboxRef = React.useRef<HTMLDivElement>(null);
  // Since this is rendered when a Popper is opened we can't use passive effects.
  // Focusing in passive effects in Popper causes scroll jump.
  useEnhancedEffect(() => {
    if (autoFocus) {
      // The ref not being resolved would be a bug in MUI.
      listboxRef.current!.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // TODO: Why this early exit?
    if (isMoving.current) {
      return;
    }

    switch (event.key) {
      case 'Home':
        // annulate both hours and minutes
        handleValueChange(0, 'partial');
        event.preventDefault();
        break;
      case 'End':
        handleValueChange(type === 'minutes' ? 59 : 23, 'partial');
        event.preventDefault();
        break;
      case 'ArrowUp':
        handleValueChange(viewValue + keyboardControlStep, 'partial');
        event.preventDefault();
        break;
      case 'ArrowDown':
        handleValueChange(viewValue - keyboardControlStep, 'partial');
        event.preventDefault();
        break;
      default:
      // do nothing
    }
  };

  return (
    <ClockRoot className={clsx(className, classes.root)}>
      <ClockClock className={classes.clock}>
        <ClockSquareMask
          data-mui-test="clock"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          ownerState={{ disabled }}
          className={classes.squareMask}
        />
        {!isSelectedTimeDisabled && (
          <React.Fragment>
            <ClockPin className={classes.pin} />
            {value != null && (
              <ClockPointer
                type={type}
                viewValue={viewValue}
                isInner={isPointerInner}
                hasSelected={hasSelected}
              />
            )}
          </React.Fragment>
        )}
        <ClockWrapper
          aria-activedescendant={selectedId}
          aria-label={localeText.clockLabelText(type, value, utils)}
          ref={listboxRef}
          role="listbox"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className={classes.wrapper}
        >
          {children}
        </ClockWrapper>
      </ClockClock>
      {ampm && ampmInClock && (
        <React.Fragment>
          <ClockAmButton
            data-mui-test="in-clock-am-btn"
            onClick={readOnly ? undefined : () => handleMeridiemChange('am')}
            disabled={disabled || meridiemMode === null}
            ownerState={ownerState}
            className={classes.amButton}
          >
            <Typography variant="caption">AM</Typography>
          </ClockAmButton>
          <ClockPmButton
            disabled={disabled || meridiemMode === null}
            data-mui-test="in-clock-pm-btn"
            onClick={readOnly ? undefined : () => handleMeridiemChange('pm')}
            ownerState={ownerState}
            className={classes.pmButton}
          >
            <Typography variant="caption">PM</Typography>
          </ClockPmButton>
        </React.Fragment>
      )}
    </ClockRoot>
  );
}
