import * as React from 'react';
import { unstable_useEventCallback as useEventCallback } from '@mui/utils';
import {
  useGridApiEventHandler,
  useGridApiOptionHandler,
} from '../../utils/useGridApiEventHandler';
import { GridEventListener } from '../../../models/events/gridEventListener';
import {
  GridEditModes,
  GridCellModes,
  GridEditingState,
  GridEditCellProps,
} from '../../../models/gridEditRowModel';
import { GridPrivateApiCommunity } from '../../../models/api/gridApiCommunity';
import { DataGridProcessedProps } from '../../../models/props/DataGridProps';
import {
  GridCellEditingApi,
  GridStopCellEditModeParams,
  GridStartCellEditModeParams,
  GridCellModesModel,
  GridCellModesModelProps,
  GridEditingSharedApi,
  GridCellEditingPrivateApi,
  GridEditingSharedPrivateApi,
} from '../../../models/api/gridEditingApi';
import { useGridApiMethod } from '../../utils/useGridApiMethod';
import { gridEditRowsStateSelector } from './gridEditingSelectors';
import { GridRowId } from '../../../models/gridRows';
import { isPrintableKey } from '../../../utils/keyboardUtils';
import { buildWarning } from '../../../utils/warning';
import { gridRowsDataRowIdToIdLookupSelector } from '../rows/gridRowsSelector';
import { deepClone } from '../../../utils/utils';
import {
  GridCellEditStartParams,
  GridCellEditStopParams,
  GridCellEditStartReasons,
  GridCellEditStopReasons,
} from '../../../models/params/gridEditCellParams';

const missingOnProcessRowUpdateErrorWarning = buildWarning(
  [
    'MUI: A call to `processRowUpdate` threw an error which was not handled because `onProcessRowUpdateError` is missing.',
    'To handle the error pass a callback to the `onProcessRowUpdateError` prop, e.g. `<DataGrid onProcessRowUpdateError={(error) => ...} />`.',
    'For more detail, see http://mui.com/components/data-grid/editing/#persistence.',
  ],
  'error',
);

export const useGridCellEditing = (
  apiRef: React.MutableRefObject<GridPrivateApiCommunity>,
  props: Pick<
    DataGridProcessedProps,
    | 'editMode'
    | 'processRowUpdate'
    | 'onCellEditStart'
    | 'onCellEditStop'
    | 'cellModesModel'
    | 'onCellModesModelChange'
    | 'onProcessRowUpdateError'
    | 'signature'
  >,
) => {
  const [cellModesModel, setCellModesModel] = React.useState<GridCellModesModel>({});
  const cellModesModelRef = React.useRef(cellModesModel);
  const prevCellModesModel = React.useRef<GridCellModesModel>({});
  const {
    processRowUpdate,
    onProcessRowUpdateError,
    cellModesModel: cellModesModelProp,
    onCellModesModelChange,
  } = props;

  const runIfEditModeIsCell =
    <Args extends any[]>(callback: (...args: Args) => void) =>
    (...args: Args) => {
      if (props.editMode === GridEditModes.Cell) {
        callback(...args);
      }
    };

  const throwIfNotEditable = React.useCallback(
    (id: GridRowId, field: string) => {
      const params = apiRef.current.getCellParams(id, field);
      if (!apiRef.current.isCellEditable(params)) {
        throw new Error(`MUI: The cell with id=${id} and field=${field} is not editable.`);
      }
    },
    [apiRef],
  );

  const throwIfNotInMode = React.useCallback(
    (id: GridRowId, field: string, mode: GridCellModes) => {
      if (apiRef.current.getCellMode(id, field) !== mode) {
        throw new Error(`MUI: The cell with id=${id} and field=${field} is not in ${mode} mode.`);
      }
    },
    [apiRef],
  );

  const handleCellDoubleClick = React.useCallback<GridEventListener<'cellDoubleClick'>>(
    (params, event) => {
      if (!params.isEditable) {
        return;
      }
      if (params.cellMode === GridCellModes.Edit) {
        return;
      }
      const newParams: GridCellEditStartParams = {
        ...params,
        reason: GridCellEditStartReasons.cellDoubleClick,
      };
      apiRef.current.publishEvent('cellEditStart', newParams, event);
    },
    [apiRef],
  );

  const handleCellFocusOut = React.useCallback<GridEventListener<'cellFocusOut'>>(
    (params, event) => {
      if (params.cellMode === GridCellModes.View) {
        return;
      }
      if (apiRef.current.getCellMode(params.id, params.field) === GridCellModes.View) {
        return;
      }
      const newParams = { ...params, reason: GridCellEditStopReasons.cellFocusOut };
      apiRef.current.publishEvent('cellEditStop', newParams, event);
    },
    [apiRef],
  );

  const handleCellKeyDown = React.useCallback<GridEventListener<'cellKeyDown'>>(
    (params, event) => {
      if (params.cellMode === GridCellModes.Edit) {
        // Wait until IME is settled for Asian languages like Japanese and Chinese
        // TODO: `event.which` is deprecated but this is a temporary workaround
        if (event.which === 229) {
          return;
        }

        let reason: GridCellEditStopReasons | undefined;

        if (event.key === 'Escape') {
          reason = GridCellEditStopReasons.escapeKeyDown;
        } else if (event.key === 'Enter') {
          reason = GridCellEditStopReasons.enterKeyDown;
        } else if (event.key === 'Tab') {
          reason = event.shiftKey
            ? GridCellEditStopReasons.shiftTabKeyDown
            : GridCellEditStopReasons.tabKeyDown;
          event.preventDefault(); // Prevent going to the next element in the tab sequence
        }

        if (reason) {
          const newParams: GridCellEditStopParams = { ...params, reason };
          apiRef.current.publishEvent('cellEditStop', newParams, event);
        }
      } else if (params.isEditable) {
        let reason: GridCellEditStartReasons | undefined;

        const canStartEditing = apiRef.current.unstable_applyPipeProcessors(
          'canStartEditing',
          true,
          { event, cellParams: params, editMode: 'cell' },
        );

        if (!canStartEditing) {
          return;
        }

        if (isPrintableKey(event)) {
          reason = GridCellEditStartReasons.printableKeyDown;
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
          reason = GridCellEditStartReasons.printableKeyDown;
        } else if (event.key === 'Enter') {
          reason = GridCellEditStartReasons.enterKeyDown;
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
          // Delete on Windows, Backspace on macOS
          reason = GridCellEditStartReasons.deleteKeyDown;
        }

        if (reason) {
          const newParams: GridCellEditStartParams = { ...params, reason, key: event.key };
          apiRef.current.publishEvent('cellEditStart', newParams, event);
        }
      }
    },
    [apiRef],
  );

  const handleCellEditStart = React.useCallback<GridEventListener<'cellEditStart'>>(
    (params) => {
      const { id, field, reason, key } = params;

      const startCellEditModeParams: GridStartCellEditModeParams = { id, field };

      if (reason === GridCellEditStartReasons.printableKeyDown) {
        if (React.version.startsWith('17')) {
          // In React 17, cleaning the input is enough.
          // The sequence of events makes the key pressed by the end-users update the textbox directly.
          startCellEditModeParams.deleteValue = true;
        } else {
          startCellEditModeParams.initialValue = key;
        }
      } else if (reason === GridCellEditStartReasons.deleteKeyDown) {
        startCellEditModeParams.deleteValue = true;
      }

      apiRef.current.startCellEditMode(startCellEditModeParams);
    },
    [apiRef],
  );

  const handleCellEditStop = React.useCallback<GridEventListener<'cellEditStop'>>(
    (params) => {
      const { id, field, reason } = params;

      apiRef.current.runPendingEditCellValueMutation(id, field);

      let cellToFocusAfter: GridStopCellEditModeParams['cellToFocusAfter'];
      if (reason === GridCellEditStopReasons.enterKeyDown) {
        cellToFocusAfter = 'below';
      } else if (reason === GridCellEditStopReasons.tabKeyDown) {
        cellToFocusAfter = 'right';
      } else if (reason === GridCellEditStopReasons.shiftTabKeyDown) {
        cellToFocusAfter = 'left';
      }

      const ignoreModifications = reason === 'escapeKeyDown';

      apiRef.current.stopCellEditMode({
        id,
        field,
        ignoreModifications,
        cellToFocusAfter,
      });
    },
    [apiRef],
  );

  useGridApiEventHandler(apiRef, 'cellDoubleClick', runIfEditModeIsCell(handleCellDoubleClick));
  useGridApiEventHandler(apiRef, 'cellFocusOut', runIfEditModeIsCell(handleCellFocusOut));
  useGridApiEventHandler(apiRef, 'cellKeyDown', runIfEditModeIsCell(handleCellKeyDown));

  useGridApiEventHandler(apiRef, 'cellEditStart', runIfEditModeIsCell(handleCellEditStart));
  useGridApiEventHandler(apiRef, 'cellEditStop', runIfEditModeIsCell(handleCellEditStop));

  useGridApiOptionHandler(apiRef, 'cellEditStart', props.onCellEditStart);
  useGridApiOptionHandler(apiRef, 'cellEditStop', props.onCellEditStop);

  const getCellMode = React.useCallback<GridCellEditingApi['getCellMode']>(
    (id, field) => {
      const editingState = gridEditRowsStateSelector(apiRef.current.state);
      const isEditing = editingState[id] && editingState[id][field];
      return isEditing ? GridCellModes.Edit : GridCellModes.View;
    },
    [apiRef],
  );

  const updateCellModesModel = useEventCallback((newModel: GridCellModesModel) => {
    const isNewModelDifferentFromProp = newModel !== props.cellModesModel;

    if (onCellModesModelChange && isNewModelDifferentFromProp) {
      onCellModesModelChange(newModel, {});
    }

    if (props.cellModesModel && isNewModelDifferentFromProp) {
      return; // The prop always win
    }

    setCellModesModel(newModel);
    cellModesModelRef.current = newModel;
    apiRef.current.publishEvent('cellModesModelChange', newModel);
  });

  const updateFieldInCellModesModel = React.useCallback(
    (id: GridRowId, field: string, newProps: GridCellModesModelProps | null) => {
      // We use the ref because it always contain the up-to-date value, different from the state
      // that needs a rerender to reflect the new value
      const newModel = { ...cellModesModelRef.current };

      if (newProps !== null) {
        newModel[id] = { ...newModel[id], [field]: { ...newProps } };
      } else {
        const { [field]: fieldToRemove, ...otherFields } = newModel[id]; // Ensure that we have a new object, not a reference
        newModel[id] = otherFields;
        if (Object.keys(newModel[id]).length === 0) {
          delete newModel[id];
        }
      }

      updateCellModesModel(newModel);
    },
    [updateCellModesModel],
  );

  const updateOrDeleteFieldState = React.useCallback(
    (id: GridRowId, field: string, newProps: GridEditCellProps | null) => {
      apiRef.current.setState((state) => {
        const newEditingState: GridEditingState = { ...state.editRows };

        if (newProps !== null) {
          newEditingState[id] = { ...newEditingState[id], [field]: { ...newProps } };
        } else {
          delete newEditingState[id][field];
          if (Object.keys(newEditingState[id]).length === 0) {
            delete newEditingState[id];
          }
        }

        return { ...state, editRows: newEditingState };
      });
      apiRef.current.forceUpdate();
    },
    [apiRef],
  );

  const startCellEditMode = React.useCallback<GridCellEditingApi['startCellEditMode']>(
    (params) => {
      const { id, field, ...other } = params;

      throwIfNotEditable(id, field);
      throwIfNotInMode(id, field, GridCellModes.View);

      updateFieldInCellModesModel(id, field, { mode: GridCellModes.Edit, ...other });
    },
    [throwIfNotEditable, throwIfNotInMode, updateFieldInCellModesModel],
  );

  const updateStateToStartCellEditMode = useEventCallback<[GridStartCellEditModeParams], void>(
    (params) => {
      const { id, field, deleteValue, initialValue } = params;

      let newValue = apiRef.current.getCellValue(id, field);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      let unstable_updateValueOnRender = false;
      if (deleteValue || initialValue) {
        newValue = deleteValue ? '' : initialValue;
        unstable_updateValueOnRender = true;
      }

      const newProps = {
        value: newValue,
        error: false,
        isProcessingProps: false,
        unstable_updateValueOnRender,
      };

      updateOrDeleteFieldState(id, field, newProps);

      apiRef.current.setCellFocus(id, field);
    },
  ) as GridCellEditingApi['startCellEditMode'];

  const stopCellEditMode = React.useCallback<GridCellEditingApi['stopCellEditMode']>(
    (params) => {
      const { id, field, ...other } = params;

      throwIfNotInMode(id, field, GridCellModes.Edit);

      updateFieldInCellModesModel(id, field, { mode: GridCellModes.View, ...other });
    },
    [throwIfNotInMode, updateFieldInCellModesModel],
  );

  const updateStateToStopCellEditMode = useEventCallback<[GridStopCellEditModeParams], void>(
    async (params) => {
      const { id, field, ignoreModifications, cellToFocusAfter = 'none' } = params;

      throwIfNotInMode(id, field, GridCellModes.Edit);

      apiRef.current.runPendingEditCellValueMutation(id, field);

      const finishCellEditMode = () => {
        updateOrDeleteFieldState(id, field, null);
        updateFieldInCellModesModel(id, field, null);
        if (cellToFocusAfter !== 'none') {
          apiRef.current.moveFocusToRelativeCell(id, field, cellToFocusAfter);
        }
      };

      if (ignoreModifications) {
        finishCellEditMode();
        return;
      }

      const editingState = gridEditRowsStateSelector(apiRef.current.state);
      const { error, isProcessingProps } = editingState[id][field];

      if (error || isProcessingProps) {
        // Attempt to change cell mode to "view" was not successful
        // Update previous mode to allow another attempt
        prevCellModesModel.current[id][field].mode = GridCellModes.Edit;
        // Revert the mode in the cellModesModel prop back to "edit"
        updateFieldInCellModesModel(id, field, { mode: GridCellModes.Edit });
        return;
      }

      const rowUpdate = apiRef.current.getRowWithUpdatedValuesFromCellEditing(id, field);

      if (processRowUpdate) {
        const handleError = (errorThrown: any) => {
          prevCellModesModel.current[id][field].mode = GridCellModes.Edit;
          // Revert the mode in the cellModesModel prop back to "edit"
          updateFieldInCellModesModel(id, field, { mode: GridCellModes.Edit });

          if (onProcessRowUpdateError) {
            onProcessRowUpdateError(errorThrown);
          } else {
            missingOnProcessRowUpdateErrorWarning();
          }
        };

        try {
          const row = apiRef.current.getRow(id)!;
          Promise.resolve(processRowUpdate(rowUpdate, row))
            .then((finalRowUpdate) => {
              apiRef.current.updateRows([finalRowUpdate]);
              finishCellEditMode();
            })
            .catch(handleError);
        } catch (errorThrown) {
          handleError(errorThrown);
        }
      } else {
        apiRef.current.updateRows([rowUpdate]);
        finishCellEditMode();
      }
    },
  ) as GridCellEditingApi['stopCellEditMode'];

  const setCellEditingEditCellValue = React.useCallback<
    GridCellEditingPrivateApi['setCellEditingEditCellValue']
  >(
    async (params) => {
      const { id, field, value, debounceMs, unstable_skipValueParser: skipValueParser } = params;

      throwIfNotEditable(id, field);
      throwIfNotInMode(id, field, GridCellModes.Edit);

      const column = apiRef.current.getColumn(field);
      const row = apiRef.current.getRow(id)!;

      let parsedValue = value;
      if (column.valueParser && !skipValueParser) {
        parsedValue = column.valueParser(value, apiRef.current.getCellParams(id, field));
      }

      let editingState = gridEditRowsStateSelector(apiRef.current.state);
      let newProps: GridEditCellProps = {
        ...editingState[id][field],
        value: parsedValue,
        changeReason: debounceMs ? 'debouncedSetEditCellValue' : 'setEditCellValue',
      };

      if (column.preProcessEditCellProps) {
        const hasChanged = value !== editingState[id][field].value;

        newProps = { ...newProps, isProcessingProps: true };
        updateOrDeleteFieldState(id, field, newProps);

        newProps = await Promise.resolve(
          column.preProcessEditCellProps({ id, row, props: newProps, hasChanged }),
        );
      }

      // Check again if the cell is in edit mode because the user may have
      // discarded the changes while the props were being processed.
      if (apiRef.current.getCellMode(id, field) === GridCellModes.View) {
        return false;
      }

      editingState = gridEditRowsStateSelector(apiRef.current.state);
      newProps = { ...newProps, isProcessingProps: false };
      // We don't update the value with the one coming from the props pre-processing
      // because when the promise resolves it may be already outdated. The only
      // exception to this rule is when there's no pre-processing.
      newProps.value = column.preProcessEditCellProps ? editingState[id][field].value : parsedValue;
      updateOrDeleteFieldState(id, field, newProps);

      editingState = gridEditRowsStateSelector(apiRef.current.state);
      return !editingState[id]?.[field]?.error;
    },
    [apiRef, throwIfNotEditable, throwIfNotInMode, updateOrDeleteFieldState],
  );

  const getRowWithUpdatedValuesFromCellEditing = React.useCallback<
    GridCellEditingPrivateApi['getRowWithUpdatedValuesFromCellEditing']
  >(
    (id, field) => {
      const column = apiRef.current.getColumn(field);
      const editingState = gridEditRowsStateSelector(apiRef.current.state);
      const row = apiRef.current.getRow(id)!;

      if (!editingState[id] || !editingState[id][field]) {
        return apiRef.current.getRow(id)!;
      }

      const { value } = editingState[id][field];
      return column.valueSetter ? column.valueSetter({ value, row }) : { ...row, [field]: value };
    },
    [apiRef],
  );

  const editingApi: Omit<GridCellEditingApi, keyof GridEditingSharedApi> = {
    getCellMode,
    startCellEditMode,
    stopCellEditMode,
  };

  const editingPrivateApi: Omit<GridCellEditingPrivateApi, keyof GridEditingSharedPrivateApi> = {
    setCellEditingEditCellValue,
    getRowWithUpdatedValuesFromCellEditing,
  };

  useGridApiMethod(apiRef, editingApi, 'public');
  useGridApiMethod(apiRef, editingPrivateApi, 'private');

  React.useEffect(() => {
    if (cellModesModelProp) {
      updateCellModesModel(cellModesModelProp);
    }
  }, [cellModesModelProp, updateCellModesModel]);

  React.useEffect(() => {
    const idToIdLookup = gridRowsDataRowIdToIdLookupSelector(apiRef);

    // Update the ref here because updateStateToStopCellEditMode may change it later
    const copyOfPrevCellModes = prevCellModesModel.current;
    prevCellModesModel.current = deepClone(cellModesModel); // Do a deep-clone because the attributes might be changed later

    Object.entries(cellModesModel).forEach(([id, fields]) => {
      Object.entries(fields).forEach(([field, params]) => {
        const prevMode = copyOfPrevCellModes[id]?.[field]?.mode || GridCellModes.View;
        const originalId = idToIdLookup[id] ?? id;
        if (params.mode === GridCellModes.Edit && prevMode === GridCellModes.View) {
          updateStateToStartCellEditMode({ id: originalId, field, ...params });
        } else if (params.mode === GridCellModes.View && prevMode === GridCellModes.Edit) {
          updateStateToStopCellEditMode({ id: originalId, field, ...params });
        }
      });
    });
  }, [apiRef, cellModesModel, updateStateToStartCellEditMode, updateStateToStopCellEditMode]);
};
