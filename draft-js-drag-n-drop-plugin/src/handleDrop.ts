import {
  DraftDragType,
  DraftHandleValue,
  EditorState,
  SelectionState,
} from 'draft-js';
import addBlock from './modifiers/addBlock';
import removeBlock from './modifiers/removeBlock';
import { DRAFTJS_BLOCK_KEY } from './constants';

export default (
  selection: SelectionState,
  dataTransfer: { data: { getData(type: string): string } },
  isInternal: DraftDragType,
  {
    getEditorState,
    setEditorState,
  }: { getEditorState(): EditorState; setEditorState(state: EditorState): void }
): DraftHandleValue => {
  const editorState = getEditorState();
  // Get data 'text' (anything else won't move the cursor) and expecting kind of data (text/key)
  const raw = dataTransfer.data.getData('text');
  const data = raw ? raw.split(':') : [];

  if (data.length !== 2) {
    return 'not-handled';
  }

  // Existing block dropped
  if (data[0] === DRAFTJS_BLOCK_KEY) {
    const blockKey = data[1];

    // Get content, selection, block
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(blockKey);
    const entity = contentState.getEntity(block.getEntityAt(0));
    const contentStateAfterInsert = addBlock(
      editorState,
      selection,
      block.getType(),
      entity.getData(),
      entity.getType()
    );
    const contentStateAfterRemove = removeBlock(
      contentStateAfterInsert,
      blockKey
    );

    // force to new selection
    const newSelection = new SelectionState({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: 0,
    });
    const newState = EditorState.push(
      editorState,
      contentStateAfterRemove,
      'insert-fragment'
    );
    setEditorState(EditorState.forceSelection(newState, newSelection));
  }

  return 'handled';
};
