# Allen & Heath Avantis Module

Controls the Allen & Heath Avantis mixer via TCP/IP MIDI protocol.

## Functions

### Channel Controls
- **Faders:**
  - Input Channels (1-64)
  - Mix Master
  - FX Send (1-12)
  - FX Return (1-12)
  - DCA (1-16)
  - Relative level adjustments (increment/decrement with acceleration)

- **Mutes:**
  - Input Channels
  - Mix Master
  - FX Send
  - FX Return
  - DCA
  - Mute Groups (1-8)

### Mix Controls
- **Send Levels:**
  - Mono Aux (1-40)
  - Stereo Aux (1-20)
  - FX Sends
  - Mono Matrix (1-40)
  - Stereo Matrix (1-20)

### Routing
- **DCA Assignments:**
  - Assign/unassign channels to DCAs
  - Multiple channel types supported

- **Main Mix Routing:**
  - Assign channels to Main Mix
  - Toggle assignments

### Channel Settings
- **Name:**
  - Set channel names (up to 8 characters)
  - Supports all channel types

- **Color:**
  - Set channel colors
  - Available colors: Off, Red, Green, Yellow, Blue, Purple, Light Blue, White

### Scene Management
- Scene recall (1-500)
- Scene bank navigation
- Current scene status feedback

### Transport Control (MMC)
- Play
- Stop
- Fast Forward
- Rewind
- Record
- Pause

### MIDI Strips
- 32 MIDI strips available
- Controls:
  - Fader levels
  - Gain control
  - Pan control
  - Send levels
  - Mute switches
  - Mix switches
  - PAFL switches
  - Custom rotary controls

### SoftKeys
- Control all 16 SoftKeys
- Press/Release actions
- Status feedback

## Setup

1. **Network Configuration:**
   - Enter the Target IP address of your Avantis console
   - Default TCP port is 51325

2. **MIDI Configuration:**
   - Enter the MIDI base channel (1-12, default is 12)
   - Can be found on your Avantis under Utility > Control > MIDI
   - Module will use 5 consecutive MIDI channels starting from the base channel

## Important Notes

- MIDI running status is supported for optimal efficiency
- Channel types use different MIDI channels relative to the base channel:
  - Base Channel (N): Inputs
  - N+1: Groups
  - N+2: Aux
  - N+3: Matrix
  - N+4: FX, Mains, DCAs

## Feedback and Variables

The module provides feedback for:
- Mute states
- Fader levels
- Current scene
- MIDI strip states
- SoftKey states

Variables are available for:
- Channel names
- Fader levels
- Mute states
- Current scene information
- MIDI strip settings
- Send levels

## Version Compatibility

- Minimum Avantis firmware version: v1.10
- Recommended Companion version: 3.0 or later

## Support

For support, please visit:
[Allen & Heath Support](https://www.allen-heath.com/support/)

Report module issues on the [Module's GitHub Repository](https://github.com/bitfocus/companion-module-allenheath-avantis)