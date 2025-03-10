---
product: date-pickers
title: React Date Range Picker component
components: DateRangePicker, DesktopDateRangePicker, MobileDateRangePicker, StaticDateRangePicker, DateRangeCalendar, DateRangePickerDay
githubLabel: 'component: DateRangePicker'
packageName: '@mui/x-date-pickers-pro'
materialDesign: https://m2.material.io/components/date-pickers
---

# Date Range Picker [<span class="plan-pro"></span>](/x/introduction/licensing/#pro-plan)

<p class="description">The Date Range Picker let the user select a range of dates.</p>

## Basic usage

{{"demo": "BasicDateRangePicker.js"}}

## Component composition

The component is built using the `MultiInputDateRangeField` for the keyboard editing and the `DateRangeCalendar` for the view editing.
All the documented props of those two components can also be passed to the Date Range Picker component.

Check-out their documentation page for more information:

- [Date Range Field](/x/react-date-pickers/date-range-field/)
- [Date Range Calendar](/x/react-date-pickers/date-range-calendar/)

The value of the component can be uncontrolled or controlled.

{{"demo": "DateRangePickerValue.js"}}

:::info

- The value is **controlled** when its parent manages it by providing a `value` prop.
- The value is **uncontrolled** when it is managed by the component's own internal state. This state can be initialized using the `defaultValue` prop.

Learn more about the _Controlled and uncontrolled_ pattern in the [React documentation](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components).
:::

## Available components

The component is available in four variants:

- The `DesktopDateRangePicker` component which works best for mouse devices and large screens.
  It renders the views inside a popover and allows editing values directly inside the field.

- The `MobileDateRangePicker` component which works best for touch devices and small screens.
  It renders the view inside a modal and does not allow editing values directly inside the field.

- The `DateRangePicker` component which renders `DesktopDateRangePicker` or `MobileDateRangePicker` depending on the device it runs on.

- The `StaticDateRangePicker` component which renders without the popover/modal and field.

{{"demo": "ResponsiveDateRangePickers.js"}}

By default, the `DateRangePicker` component renders the desktop version if the media query [`@media (pointer: fine)`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer) matches.
This can be customized with the `desktopModeMediaQuery` prop.

:::warning
Responsive components can suffer some inconsistencies between testing environments if media query is not supported.
Please refer to [this section](/x/react-date-pickers/base-concepts/#testing-caveats) for solutions.
:::

## Form props

The component can be disabled or read-only.

{{"demo": "FormPropsDateRangePickers.js"}}

## Customization

### Render 1 to 3 months

You can render up to 3 months at the same time using the `calendars` prop.

:::info
This prop will be ignored on the mobile picker.
:::

{{"demo": "DateRangePickerCalendarProp.js"}}

### Use a single input field

You can pass the `SingleInputDateRangeField` component to the Date Range Picker to use it for keyboard editing:

{{"demo": "SingleInputDateRangePicker.js"}}

:::info
For more information, check out the [Custom field](/x/react-date-pickers/custom-field/#use-single-input-fields-on-range-pickers) page.
:::

### Add shortcuts

To simplify range selection, you can add [shortcuts](/x/react-date-pickers/shortcuts/#range-shortcuts).

{{"demo": "BasicRangeShortcuts.js", "bg": "inline", "defaultCodeOpen": false}}

## Validation

You can find the documentation in the [Validation page](/x/react-date-pickers/validation/)

## 🚧 Month Range Picker

:::warning
This feature isn't implemented yet. It's coming.

👍 Upvote [issue #4995](https://github.com/mui/mui-x/issues/4995) if you want to see it land faster.
:::

The Month Range Picker allows setting a range of months.
