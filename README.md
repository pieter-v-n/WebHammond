# WebHammond
Hammond organ emulator for the browser. No hardware needed. No software, no plug-ins, no drivers needed. Play Hammond Organ directly in the browser. Try here: [WebHammond](https://thermis.nl/hammond/): see section [Usage](https://github.com/pieter-v-n/WebHammond/blob/main/README.md#usage) below.

## Introduction
This project provides you a Hammond Tonewheel Organ in the browser.
The objective for this project was to understand the mechanisms behind the working of the Hammond Tonewheel organ.
The organ is in fact an electro-mechanical polyphonic additive synthesizer.
Here is an overview of the organ. ![Overview of the Hammond Emulator.](/docs/hammond-overview.png)
* The 91 tonewheels that are spinning with a constant speed produce sinusodial signals continuously. Different tones are produced because the tonewheels have a different amount of teeth. Also, the tonewheels are geared from the main motor with different gear ratios. 
* When a key is pressed (or a MIDI note-on message is received), several of these tones are switched through to a set of draw-bars. These draw-bars regulate the volume of each tone (harmonic) to influence the timbre. This is a characteristic feature of the organ. This emulator provides an upper manual with 61 keys (5 octaves), a lower manual with 61 keys and a pedal  board with 25 keys (2 octaves). The upper and lower manuals have 9 drawbars, while the pedals have 2 drawbars. 
* For making the sound of these tones more rich, the signal is further processed by a vibrato (with variable speed and depth), a chorus and a compressor. The vibrato makes small changes in frequency and phase of the signal by implementing the "scanner" circuit from the original Hammond organ. This circuit consists of 17 delay lines that are subsequently scanned by a rotor. The compressor reduces the dynamic range of the organ, such that the amplification of louder signals are reduced. This emulates the behaviour of tube amplifiers (in particular their power supply).
* The Leslie emulates the Leslie box, where 2 rotating speakers spread the sound into the listening space. This is emulated by two delay lines that are scanned in a similar way as the Vibrato, producing the Doppler effect. The stereo panner positions the sound into space in sync with the Doppler effect. The reverb emulates the acoustics of various environments where the organ is played. This is achieved by convoluting the signal with the Impulse Response from that space. See [Reverb.js](http://reverbjs.org/) for details.
* A GUI is provided to control the upper and lower manuals, to enable MIDI input, and to change the settings of various parameters of the organ.

## To do:
The project is still in prototyping mode. The following is still to be done:
* Restyling of the GUI
* Add Leakage control to the GUI
* Add Leslie switch (off/slow/fast) to GUI to replace the speed and depth sliders
* Add Dry/Wet control to GUI to mix pre- and post reverb signals
* Add percussion
* Fine tuning of the compressor parameters
* Fine tuning of the Leslie delay lines

# Requirements
This organ runs completely in the browser. A server is only needed to serve the HTML, CSS, JS and WAV files to the client.
This project is fully dependent on the Web Audio API and the MIDI API. This should be supported by all modern browsers.
This should be run on computer with sufficient (real-time) performance. Due to the scheduling mechanism in Windows OS, smooth playing on Windows based computers is a challenge. Try Linux in stead.
For using MIDI, due to security constraints, the files for the browser should be served remotely via https. Locally, the files can be served via http for MIDI to work. 

# Detailed desciption
## Tone Generator
The tone generator is provided by the Generator class. It instantiates the (91) sine oscillators using the toneWheels array to define each frequency. In the real organ, 2 tone wheels and their pick-up elements are mounted close together in the same metal compartment. This causes leakage from one tone wheel to the other. This leakage can be enabled by the leakage control. The leakMap array defines which tone wheels are adjacent. ![tone generator](/docs/hammond-tonegenerator.png)
Note that all oscillators produce a sine wave. Some Hammond organs have tone wheels for the lowest frequencies with a special shape in order to introduce harmonics. This has been tried in the emulator but this is not improving the sound. 

## Keyboards
This organ provides 3 keyboards: the upper manual with 61 keys, the lower manual with 61 keys and the pedal board with 25 keys.
When a key is pressed on the upper or lower manual, 9 contacts will close. The keyContactsMap array defines which tone is switched by that key. For the pedal keyboard, each pedal has 2 contacts.
These 9 signals from the key contacts are first fed into filters to reduce the key click. The key click is the phenomenon where when a contact is closed, the signal from the oscillator is not zero, i.e. the signal will rise instantanously from 0 to that value. This causes a sharp transient in the signal, audible as a click. The same happens when a contact is opened again: the signal suddenly drops to 0. To reduce the effect of this, a set of low-pass filters are added, to smooth out the signal a little bit. Then the signals are fed to the draw-bars, to regulate the volume of each tone, i.e. change its timbre. The timbre is defined by the amount of harmonics present in the signal. ![keyboards](/docs/hammond-keyboards.png)

## Vibrato, Chorus and Compressor
To further enhance the sound from the keyboards, a vibrato and chorus is added. The vibrato changes the frequency and phase of the signal a little bit. This is achieved in the same way as in the original Hammond organ: by delaying the signal by 17 delay lines and then taking the delayed signals by a rotor that scans each delay line sequentially. Here, the delay lines are created by the DelayNodes. The scanner is emulated by an oscillator that is input to a set of wave shapers. These wave shapers effectively produce an output only when the magnitude of the input (the tringle waveform) falls within a certain interval. The result is a sequence of triggers that controls the gate for each delay line.
The chorus is implemented by just taking a delayed input signal and to add to this the output from the vibrato.
The upper and lower manuals have their own vibrato and chorus and the speed and depth can be individually controlled by the GUI.
The volume of the signal is controlled by the swell pedal. When a MIDI keyboard is connnected, the value of the pitch-bend parameter is used to act as the swell pedal.
The compressor reduces the dynamic range of the signal. This emulates the effects of the power supply and the tube amplifier of the original organ not be able to produce a constant amplification of the signal. When the signal is loud, the amplification is reduced. ![Vibrato, Chorus and Compressor](/docs/hammond-vibrato.png) Before the signal is going to the Leslie unit, it is split into a high and low frequency signal by a high-pass and low-pass filter.

## Leslie and Reverb
Although not part of the Hammond organ, the Leslie box must not be omitted. Its primary goal is to spread the organ sound into the listening space, hereby producing a Doppler effect by the rotating speakers.
For the real Leslie box, the signal with higher frequencies is fed to the rotating horn speaker and the lower frequencies are fed to the bass speaker with its rotating baffle. Note: the horn and baffle are rotating in opposite directions.
In the emulator, the two signals with high and low frequency components are fed into the two leslie components. The leslie is implemented in a similar way as the vibrato component: the signal is fed into a set of delay lines and a scanner taps the signal from the delay lines to produce the Doppler effect of the rotating speaker. In addition to the frquency and phase shifts, a stereo panner component moves the signal from left to right and back in sync with the Doppler effect. The result is the sound you would expect from a rotating speaker. The other leslie unit works the same, with the direction of rotation reversed. ![Leslie and Reverb](/docs/hammond-leslie.png)
In reality, the Hammond organ and its accompanying Leslie box is located in a listening space. This space has specific acoustic parameters. This emulator provides a extensive list of listening spaces. The user can select a listening space and the emulator will adjust the signal to mimic that environment. This is accomplished by the reverb component. The acoustics of each space is determined by recording the Impulse Response (by firing a pistol or a hand clap in that space). The organ signal and the impulse response signal are then convoluted to produce the final audio signal for listening.

# Usage
After downloading the `index.html`, `main.css`, `main.js` and `vwood.jpg` files into a root folder, and the reverb `.wav` files in the `library` folder, you are good to go.
You can try yourself here: [WebHammond](https://thermis.nl/hammond/).
![Screenshot](/docs/HammondEmulator.png)

## Starting the organ
Before you can play anything, you need to switch on the organ, like the real thing. Click on the `Start` button. The button turns green and shows `Running`.

## Use the draw-bars
When the draw-bars are in the initial position, nothing will be heard because no signals from the oscillators are fed to the output. Therefor, use the sliders in downward direction to increase the volume. The upper-, lower- and pedal keyboards have thier own draw-bars.

## Play the notes
After you have set the draw-bars, you can check the Hammond sound by playing some notes on the virtual keyboards. There is an upper and a lower virtual keyboard. No pedals are provided.
If you click on a key, it will be played. If you unclick a key, the note will stop playing. In order to play poly-phonic, you can click a on a key and while holding down, move the pointer away. The note will continue to play. Now you can click another key to add a note to play.

## Connect a physical MIDI keyboard
If you want to play more than just a few notes, you need a better keyboard. Simply connect the physical MIDI keyboard to your computer and click the `MIDI` button. Initially, the MIDI keyboard will be associated with the Upper manual. You can select also the Lower manual or Pedal to be associated with the MIDI keyboard. If your MIDI keyboard has a pitch-bend wheel, then use this as the expression (swell) pedal.

## Change Vibrato, Chorus and Leslie settings
By moving the horizontal sliders, you can change the effect of the Vibrato, Chorus and Leslie:
- `uVf`: Upper Manual Vibrato Frequency (slow - fast)
- `uVd`: Upper Manual Vibrato Depth (none - max)
- `uCh`: Upper Manual Chorus (none - max)
- `lVf`: Lower Manual Vibrato Frequency (slow - fast)
- `lVd`: Lower Manual Vibrato Depth (none - max)
- `lCh`: Lower Manual Chorus (none - max)
- `lsf`: Leslie Speed (none - slow - fast)
- `lsd`: Leslie Depth (none - max)

## Change listening environment
Initially, the organ is placed in the `DomesticLivingRoom` listening environment. This provides a short and dampened reverb. For other listing environments, most with far more reverb, select another one from the pulldown menu. The reverb for each listening environment is obtained by recording the impulse response of the room. This response is then convoluted in real-time with the organ sound, resulting in a realistic organ experience.

- Abernyte Grain Silo 
- Arbroath Abbey Sacristy
- Basement
- Domestic Living Room
- Elveden Hall Lords Cloakroom
- Elveden Hall Marble Hall
- Elveden Hall Smoking Room
- Elveden Hall Visitors Cloakroom
- Empty Apartment Bedroom
- Errol Brickworks Kiln
- Falkland Palace Royal Tennis Court
- Hamilton Mausoleum
- Inside Piano
- Kinoull Aisle
- Lady Chapel St Albans Cathedral
- Maes Howe
- Midiverb Mark2 Preset29
- Perth City Hall Balcony
- Purnodes Railroad Tunnel
- R1 Nuclear Reactor Hall
- Saint Lawrence Church Molenbeek Wersbeek Belgium
- Spokane Womans Club
- Sports Centre University Of York
- Stairway University Of York
- St Andrews Church
- St Marys Abbey Reconstruction Phase1
- St Marys Abbey Reconstruction Phase2
- St Marys Abbey Reconstruction Phase3
- St Patricks Church Patrington Position1
- St Patricks Church Patrington Position2
- St Patricks Church Patrington Position3
- Terrys Factory Warehouse
- Terrys Typing Room
- Tyndall Bruce Monument
- Underground Car Park
- York Minster
