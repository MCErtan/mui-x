import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme, styled, Theme, useThemeProps } from '@mui/material/styles';
import { unstable_composeClasses as composeClasses } from '@mui/utils';
import { PickersToolbarText } from '../internals/components/PickersToolbarText';
import { PickersToolbarButton } from '../internals/components/PickersToolbarButton';
import { PickersToolbar } from '../internals/components/PickersToolbar';
import { pickersToolbarClasses } from '../internals/components/pickersToolbarClasses';
import { arrayIncludes } from '../internals/utils/utils';
import { useLocaleText, useUtils } from '../internals/hooks/useUtils';
import { useMeridiemMode } from '../internals/hooks/date-helpers-hooks';
import { BaseToolbarProps, ExportedBaseToolbarProps } from '../internals/models/props/toolbar';
import {
  getTimePickerToolbarUtilityClass,
  timePickerToolbarClasses,
  TimePickerToolbarClasses,
} from './timePickerToolbarClasses';
import { TimeViewWithMeridiem } from '../internals/models';

export interface TimePickerToolbarProps<TDate>
  extends BaseToolbarProps<TDate | null, TimeViewWithMeridiem> {
  ampm?: boolean;
  ampmInClock?: boolean;
  classes?: Partial<TimePickerToolbarClasses>;
}

export interface ExportedTimePickerToolbarProps extends ExportedBaseToolbarProps {
  ampm?: boolean;
  ampmInClock?: boolean;
}

const useUtilityClasses = (ownerState: TimePickerToolbarProps<any> & { theme: Theme }) => {
  const { theme, isLandscape, classes } = ownerState;

  const slots = {
    root: ['root'],
    separator: ['separator'],
    hourMinuteLabel: [
      'hourMinuteLabel',
      isLandscape && 'hourMinuteLabelLandscape',
      theme.direction === 'rtl' && 'hourMinuteLabelReverse',
    ],
    ampmSelection: ['ampmSelection', isLandscape && 'ampmLandscape'],
    ampmLabel: ['ampmLabel'],
  };

  return composeClasses(slots, getTimePickerToolbarUtilityClass, classes);
};

const TimePickerToolbarRoot = styled(PickersToolbar, {
  name: 'MuiTimePickerToolbar',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root,
})<{
  ownerState: TimePickerToolbarProps<any>;
}>({
  [`& .${pickersToolbarClasses.penIconButtonLandscape}`]: {
    marginTop: 'auto',
  },
});

const TimePickerToolbarSeparator = styled(PickersToolbarText, {
  name: 'MuiTimePickerToolbar',
  slot: 'Separator',
  overridesResolver: (props, styles) => styles.separator,
})({
  outline: 0,
  margin: '0 4px 0 2px',
  cursor: 'default',
});

const TimePickerToolbarHourMinuteLabel = styled('div', {
  name: 'MuiTimePickerToolbar',
  slot: 'HourMinuteLabel',
  overridesResolver: (props, styles) => [
    {
      [`&.${timePickerToolbarClasses.hourMinuteLabelLandscape}`]: styles.hourMinuteLabelLandscape,
      [`&.${timePickerToolbarClasses.hourMinuteLabelReverse}`]: styles.hourMinuteLabelReverse,
    },
    styles.hourMinuteLabel,
  ],
})<{
  ownerState: TimePickerToolbarProps<any>;
}>(({ theme, ownerState }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'flex-end',
  ...(ownerState.isLandscape && {
    marginTop: 'auto',
  }),
  ...(theme.direction === 'rtl' && {
    flexDirection: 'row-reverse',
  }),
}));

TimePickerToolbarHourMinuteLabel.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  as: PropTypes.elementType,
  ownerState: PropTypes.object.isRequired,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])),
    PropTypes.func,
    PropTypes.object,
  ]),
} as any;

const TimePickerToolbarAmPmSelection = styled('div', {
  name: 'MuiTimePickerToolbar',
  slot: 'AmPmSelection',
  overridesResolver: (props, styles) => [
    { [`.${timePickerToolbarClasses.ampmLabel}`]: styles.ampmLabel },
    { [`&.${timePickerToolbarClasses.ampmLandscape}`]: styles.ampmLandscape },
    styles.ampmSelection,
  ],
})<{
  ownerState: TimePickerToolbarProps<any>;
}>(({ ownerState }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginRight: 'auto',
  marginLeft: 12,
  ...(ownerState.isLandscape && {
    margin: '4px 0 auto',
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexBasis: '100%',
  }),
  [`& .${timePickerToolbarClasses.ampmLabel}`]: {
    fontSize: 17,
  },
}));

TimePickerToolbarAmPmSelection.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  as: PropTypes.elementType,
  ownerState: PropTypes.object.isRequired,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])),
    PropTypes.func,
    PropTypes.object,
  ]),
} as any;

function TimePickerToolbar<TDate extends unknown>(inProps: TimePickerToolbarProps<TDate>) {
  const props = useThemeProps({ props: inProps, name: 'MuiTimePickerToolbar' });
  const {
    ampm,
    ampmInClock,
    value,
    isLandscape,
    onChange,
    view,
    onViewChange,
    views,
    disabled,
    readOnly,
    ...other
  } = props;
  const utils = useUtils<TDate>();
  const localeText = useLocaleText<TDate>();

  const theme = useTheme();
  const showAmPmControl = Boolean(ampm && !ampmInClock && views.includes('hours'));
  const { meridiemMode, handleMeridiemChange } = useMeridiemMode(value, ampm, onChange);

  const formatHours = (time: TDate) =>
    ampm ? utils.format(time, 'hours12h') : utils.format(time, 'hours24h');

  const ownerState = props;
  const classes = useUtilityClasses({ ...ownerState, theme });

  const separator = (
    <TimePickerToolbarSeparator
      tabIndex={-1}
      value=":"
      variant="h3"
      selected={false}
      className={classes.separator}
    />
  );

  return (
    <TimePickerToolbarRoot
      landscapeDirection="row"
      toolbarTitle={localeText.timePickerToolbarTitle}
      isLandscape={isLandscape}
      ownerState={ownerState}
      className={classes.root}
      {...other}
    >
      <TimePickerToolbarHourMinuteLabel className={classes.hourMinuteLabel} ownerState={ownerState}>
        {arrayIncludes(views, 'hours') && (
          <PickersToolbarButton
            data-mui-test="hours"
            tabIndex={-1}
            variant="h3"
            onClick={() => onViewChange('hours')}
            selected={view === 'hours'}
            value={value ? formatHours(value) : '--'}
          />
        )}

        {arrayIncludes(views, ['hours', 'minutes']) && separator}
        {arrayIncludes(views, 'minutes') && (
          <PickersToolbarButton
            data-mui-test="minutes"
            tabIndex={-1}
            variant="h3"
            onClick={() => onViewChange('minutes')}
            selected={view === 'minutes'}
            value={value ? utils.format(value, 'minutes') : '--'}
          />
        )}

        {arrayIncludes(views, ['minutes', 'seconds']) && separator}
        {arrayIncludes(views, 'seconds') && (
          <PickersToolbarButton
            data-mui-test="seconds"
            variant="h3"
            onClick={() => onViewChange('seconds')}
            selected={view === 'seconds'}
            value={value ? utils.format(value, 'seconds') : '--'}
          />
        )}
      </TimePickerToolbarHourMinuteLabel>
      {showAmPmControl && (
        <TimePickerToolbarAmPmSelection className={classes.ampmSelection} ownerState={ownerState}>
          <PickersToolbarButton
            disableRipple
            variant="subtitle2"
            data-mui-test="toolbar-am-btn"
            selected={meridiemMode === 'am'}
            typographyClassName={classes.ampmLabel}
            value={utils.getMeridiemText('am')}
            onClick={readOnly ? undefined : () => handleMeridiemChange('am')}
            disabled={disabled}
          />
          <PickersToolbarButton
            disableRipple
            variant="subtitle2"
            data-mui-test="toolbar-pm-btn"
            selected={meridiemMode === 'pm'}
            typographyClassName={classes.ampmLabel}
            value={utils.getMeridiemText('pm')}
            onClick={readOnly ? undefined : () => handleMeridiemChange('pm')}
            disabled={disabled}
          />
        </TimePickerToolbarAmPmSelection>
      )}
    </TimePickerToolbarRoot>
  );
}

TimePickerToolbar.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  ampm: PropTypes.bool,
  ampmInClock: PropTypes.bool,
  classes: PropTypes.object,
  /**
   * className applied to the root component.
   */
  className: PropTypes.string,
  disabled: PropTypes.bool,
  /**
   * If `true`, show the toolbar even in desktop mode.
   * @default `true` for Desktop, `false` for Mobile.
   */
  hidden: PropTypes.bool,
  isLandscape: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  /**
   * Callback called when a toolbar is clicked
   * @template TView
   * @param {TView} view The view to open
   */
  onViewChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  titleId: PropTypes.string,
  /**
   * Toolbar date format.
   */
  toolbarFormat: PropTypes.string,
  /**
   * Toolbar value placeholder—it is displayed when the value is empty.
   * @default "––"
   */
  toolbarPlaceholder: PropTypes.node,
  value: PropTypes.any,
  /**
   * Currently visible picker view.
   */
  view: PropTypes.oneOf(['hours', 'meridiem', 'minutes', 'seconds']).isRequired,
  views: PropTypes.arrayOf(PropTypes.oneOf(['hours', 'meridiem', 'minutes', 'seconds']).isRequired)
    .isRequired,
} as any;

export { TimePickerToolbar };
