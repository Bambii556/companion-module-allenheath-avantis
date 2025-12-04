# companion-module-allenheath-avantis

Allen & Heath Avantis Mixer module for Bitfocus Companion.

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## Features

### Fader Control

- **Instant Fader Control**: Set fader levels for Inputs, Mix Masters, FX Sends, FX Returns, and DCAs
- **Fade Fader Control** ⭐ NEW: Smoothly fade faders to target levels over a specified duration (0.1-60 seconds)
  - Supports all channel types: Inputs, Groups, Aux, Matrix, Mains, DCAs, and FX Returns
  - Configurable fade duration and target level
  - Optional current level specification for precise control

### Mute Control

- Mute control for all channel types and mute groups
- Supports Inputs, Mix Masters, FX Sends, FX Returns, DCAs, and Mute Groups

### Routing & Sends

- Send level control for Aux, FX, and Matrix sends
- DCA and Mute Group assignments
- Channel to Main Mix assignment

### Channel Configuration

- Channel name control (up to 8 characters)
- Channel color control (8 colors available)

### Scene Management

- Scene recall (500 scenes across 4 banks)

### MIDI Transport Control ⭐ NEW

- Stop
- Play
- Record
- Rewind
- Fast Forward
- Pause

## Configuration

1. Enter the IP address of your Avantis console
2. Set the MIDI base channel (default: 1, must match console settings under Utility > Control > MIDI)

## Protocol

This module uses the Avantis TCP/IP MIDI protocol on port 51325. For detailed protocol information, see the [Avantis MIDI TCP Protocol documentation](./support/Avantis-MIDI-TCP-Protocol-V1.0.pdf).

## Version History

### v1.2.0 (Latest)

- ⭐ Added Fade Fader actions with configurable duration and target level
- ⭐ Added MIDI Transport Control (MMC) support
- Updated to @companion-module/base v1.13.5
- Improved TCP connection status handling
- Fixed TypeScript type safety issues
- Enhanced error handling and logging

### v1.1.4

- Initial stable release
- Core fader, mute, and routing functionality
