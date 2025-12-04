# Allen & Heath Avantis module

Controls the Allen & Heath Avantis mixer via TCP/IP MIDI protocol.

## Features:

### Fader Control

- **Instant Fader Control**: Set fader levels immediately for all channel types
- **Fade Fader Control** ⭐ NEW: Smoothly fade faders over time
  - Configurable duration (0.1 to 60 seconds)
  - Set target level
  - Optional current level specification
  - Supports: Inputs, Groups (Mono/Stereo), Aux (Mono/Stereo), Matrix (Mono/Stereo), Mains, DCAs, FX Returns

### Mute Control

- Mute/Unmute for all channel types:
  - Inputs (1-64)
  - Mix Masters (Mono Groups, Stereo Groups, Mono Aux, Stereo Aux, Mono Matrix, Stereo Matrix)
  - FX Sends (Mono/Stereo)
  - FX Returns
  - DCAs
  - Mute Groups

### Routing & Sends

- Send Levels: Control Aux, FX, and Matrix send levels
- DCA Assignment: Assign channels to DCA groups
- Mute Group Assignment: Assign channels to mute groups
- Main Mix Assignment: Route channels to main mix

### Channel Configuration

- **Channel Name**: Set channel names (up to 8 characters)
- **Channel Color**: Set channel colors (8 colors available: Off, Red, Green, Yellow, Blue, Purple, Lt Blue, White)

### Scene Management

- **Scene Recall**: Recall any of 500 scenes across 4 banks

### MIDI Transport Control ⭐ NEW

- Stop
- Play
- Record
- Rewind
- Fast Forward
- Pause

## Setup

1. Enter the **Target IP address** of your Avantis console
2. Enter the **MIDI base channel** (default: 1)
   - This must match the setting on your Avantis console
   - Found under: Utility > Control > MIDI
   - Valid range: 1-12

## Usage Examples

### Fade Example

To create a smooth 3-second fade from current level to -10dB:

1. Add a "Fade Input Fader" action
2. Select your channel
3. Set Duration to 3 seconds
4. Select target level (-10dB)
5. Leave Current Level at 0 (will start from current position)

### Transport Control

Use the Transport actions to control DAW playback, recording, and navigation via MIDI Machine Control (MMC).

## Technical Details

- **Protocol**: Avantis TCP/IP MIDI Protocol V1.10
- **Port**: 51325
- **Connection**: TCP
- **API Version**: @companion-module/base v1.13.5

## Troubleshooting

- **Connection Issues**: Verify the IP address and ensure the console is on the same network
- **MIDI Channel Mismatch**: Ensure the MIDI base channel matches the console settings
- **Fade Not Working**: Check that the target level is different from the current level

> Module Version: 1.2.0
> Protocol Version: 1.10
