# WebHammond
Hammond organ emulator for the browser. 

## Introduction
This project provides you a Hammond Tonewheel Organ in the browser.
The objective for this project was to understand the mechanisms behind the working of the Hammond Tonewheel organ.
The organ is in fact an electro-mechanical additive synthesizer.
Here is an overview of the organ. ![Overview of the Hammond Emulator.](/docs/hammond-overview.png)
* The 91 tonewheels that are spinning with a constant speed produce sinusodial signals continuously. Different tones are produced because the tonewheels have a different amount of teeth. Also, the tonewheels are geared from the main motor. 
* When a key is pressed (or a MIDI note on message is received), seevral of these tones are switched through to a set of draw-bars. These draw-bars regulate the volume of each tone (harmonic) to influence the timbre. This is a characteristic feature of the organ. This emulator provides an upper manual with 61 keys (5 octaves), a lower manual with 61 keys and a pedal  board with 25 keys (2 octaves). The upper and lower manuals have 9 drawbars, while the pedals have 2 drawbars. 
* For making the sound of these tones more rich, the signal is further processed by a vibrato (with variable speed and depth), a chorus and a compressor. The vibrato makes small changes in frquency and phase of the signal by implementing the "scanner" circuit from the original Hammond organ. This circuit consists of 17 delay lines that are subsequently scanned by a rotor. The compressor reduces the dynamic range of the organ, such that the amplification of louder signals are reduced. This emulates the behaviour of tube amplifiers (in particular their power supply).
* The Leslie emulates the Leslie box, where 2 rotating speakers spread the sound into the listening space. This is emulated by two delay lines that are scanned in a similar way as the Vibrato, prodcuing the Doppler effect. The stereo panner positions the sound into space in sync with the Doppler effect. The reverb emulates the acoustics of various environments where the organ is played. This is achieved by convoluting the signal with the Impulse Response from that space. See [Reverb.js](http://reverbjs.org/) for details.
* A GUI is provided to control the upper and lower manuals, to enable MIDI input, and to change the settings of various parameters of the organ.

## To do:
The project is still in prototyping mode. The following is still to be done:
* Restyling of the GUI
* Add Leakage control to the GUI
* Add Leslie switch (off/slow/fast) to GUI to replace the speed and depth sliders
* Add Dry/Wet control to GUI to mix pre- and post reverb signals
* Add precussion
* Fine tuning of the compressor parameters

# Requirements
This organ runs completely in the browser. A server is only needed to serve the HTML, CSS, JS and WAV files to the client.
This project is fully dependent on the Web Audio API and the MIDI API. This should be supported by all modern browsers.
This should be run on computer with sufficient (real-time) performance. Due to the scheduling mechanism in Windows OS, smooth playing on Windows based comoputers is a challenge. Try Linux in stead.
For using MIDI, due to security constraints, the files for the browser should be served remotely via https. Locally, the files can be served via http for MIDI to work. 

# Detailed desciption
## Tone Generator
The tone generator is provided by the Generator class. It instantiates the (91) sine oscillators using the toneWheels array to define each frequency. In the real organ, 2 tone wheels and their pick-ips are mounted close together in the same metal compartment. This causes leakage from one tone wheel to the other. This leakage can be enabled by the leakage control. The leakMap array defines which tone wheels are adjacent. ![tone generator](/docs/hammond-tonegenerator.png)
Note that all oscillators produce a sine wave. Some Hammond organs have tone wheels (for the lowest frequencies) with a special shape, in order to introduce harmonics. This has been tried in the emulator but this is not improving the sound. 

## Keyboards
This organ provides 3 keyboards: the upper manual with 61 keys, the lower manual with 61 keys and the pedal boar with 25 keys.
When a key is pressed on the upper or lower manual, 9 contacts will close. The keyContactsMap array defines which tone is switched by that key. For the pedal keyboard, each pedal has 2 contacts.
These 9 signals from the key contacts are first fed into filters to reduce the key click. The key click is the phenomena that when a contact is closed, the signal from the oscillator is not zero, i.e. the signal will rise instantanously from 0 to that value. This coases a sharp transient in the signal, audible as a click. The same happens when a contact is opened: the signal suddenly drops to 0. To reduce the effect of this, a set of low-pass filters are added, to smooth out the signal a little bit. Then the signals are fed to the draw-bars, to regulate the volume of each tone, i.e. change its timbre. The timbre is defined by the amount of harmonics present in the signal. ![keybaords](/docs/hammond-keyboards.png)

## Vibrato, Chorus and Compressor
To further enhance the sound from the keyboards, a vibrato and chorus is added. The vibrato changes the frequency and phase of the signal a little bit. This is achieved in the same way as in the original Hammond organ: by delaying the signal by 17 delay lines and that taking the delayed signals by a rotor that scans each delay line sequentially. Here, the delay lines are created by the DelayNodes. The scanner is emulated by an oscillator that is input to a set of wave shapers. These wave shapers effectively produce an output only when the magnitude of the input (the tringle waveform) falls within a certain interval. The result is a sequence of triggers that controls the gate for each delay line.
The chorus is implemented by just taking a delayed input signal and to add to this the output from the vibrato.
The upper and lower manuals have their own vibrato and chorus and the speed and depth can be individually controlled by the GUI.
The compressor reduces the dynamic range of the signal. This emulates the effects of the power supply and the tube amplifier of the original organ not be able to produce a constant amplifiaction of the signal. When the signal is load, the amplification is reduced. ![Vibrato, Chorus and Compressor](/docs/hammond-vibrato.png) Before the signal is going to the Leslie unit, it is split into a high and low frequency signal by a high-pass and low-pass filter.
