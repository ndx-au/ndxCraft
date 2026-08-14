# ndxCraft design system

Editorial workstation for Sentinel **fcms** authors. Quiet chrome, loud content.

## Metaphor

Linear chrome + VS Code density + Typora visual writing. Not Notion. Not WordPress.

## Color

Meaning, not decoration.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| App | `#0B0F14` | `#F7F6F3` | Window |
| Panel | `#12171F` | `#FFFFFF` | Sidebars, inspector |
| Raised | `#1A222C` | `#F3F1EC` | Toolbars, cards |
| Border | `#243040` | `#E7E2D8` | Dividers |
| Ink | `#E8EEF5` | `#1A1F27` | Primary text |
| Muted | `#8B9BB0` | `#5C6773` | Secondary text |
| fcms | `#3DD6F5` | `#0E8AA8` | Kit / slug identity |
| Dirty | `#E8B84A` | `#B8860B` | Unsaved |
| OK | `#3DDC97` | `#1A8F5C` | Harness matched |
| Danger | `#F07178` | `#C23B3B` | Errors only |

Accent cyan is reserved for fcms. Do not paint buttons cyan unless they relate to kits, slugs, or site preview.

## Type

- UI: IBM Plex Sans 13–14px
- Source: IBM Plex Mono 13–14px
- Visual editor: IBM Plex Sans 16–18px / line-height 1.65
- No serif. No emoji icons.

## Density

- Titlebar / toolbar: 36px
- Status bar: 28px
- Activity rail: 40px
- Chrome click targets: ≥ 32px
- Editor stays dense

## Motion

150–200ms color/opacity only. Honour `prefers-reduced-motion`.

## Interaction

- Lucide icons with `aria-label` on icon-only buttons
- Visible focus rings (`ring-fcms`)
- `cursor-pointer` on clickable chrome
- Tab is never stolen from the editor
- Toasts for save/errors; dialogs for destructive choices
