const audioCtx = new AudioContext();
let midiMapState = 0; // no Midi keyboard attached yet


const toneWheels = [ // Model 91 Frequency Generator, value in Hz
    32.692, 34.634, 36.712, 38.889, 41.200, 43.636, 46.250, 49.000, 51.892, 55.000, 58.261, 61.714,                         // C1-B2 0 - 11 
    65.385, 69.268, 73.425, 77.778, 82.400, 87.273, 92.500, 98.000, 103.784, 110.000, 116.522, 123.429,                     // C2-B3 12 - 23
    130.769, 138.537, 146.849, 155.556, 164.800, 174.545, 185.000, 196.000, 207.568, 220.000, 233.043, 246.857,             // C3-B4 24 - 35
    261.538, 277.073, 293.699, 311.111, 329.600, 349.091, 370.000, 392.000, 415.135, 440.000, 466.087, 493.714,             // C4-B5 36 - 47
    523.077, 554.146, 587.397, 622.222, 659.200, 698.182, 740.000, 784.000, 830.270, 880.000, 932.174, 987.429,             // C5-B6 48 - 59
    1046.154, 1108.293, 1174.795, 1244.444, 1318.400, 1396.364, 1480.000, 1568.000, 1660.541, 1760.000, 1864.348, 1974.857, // C6-B7 60 - 71
    2092.308, 2216.585, 2349.589, 2488.889, 2636.800, 2792.727, 2960.000, 3136.000, 3321.081, 3520.000, 3728.696, 3949.714, // C7-B8 72 - 83
    4189.091, 4440.000, 4704.000, 4981.622, 5280.000, 5593.043, 5924.571,                                                   // C8-F#9 84 - 90
];

// foldback used to reduce number of required tone wheels
/*
                Lower Foldback         Top Foldback
Sub-Fundamental	X13-24X         13-61		
Sub-Third                       20-80		
Fundamental                     13-73		
Second                          25-85		
Third                           31-91  80	
Fourth                          37-91  80-85	
Fifth                           41-91  80-89	
Sixth                           44-91  80-91 80
Eighth                          49-91  80-91 80-85
*/

const leakMap = [ // from which osc is leak received; -1 means no leak
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, // C1-B2 0 - 11 
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, // C2-B3 12 - 23
    72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, // C3-B4 24 - 35
    84, 85, 86, 87, 88, 89, 90, -1, -1, -1, -1, -1, // C4-B5 36 - 47
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, // C5-B6 48 - 59
    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, // C6-B7 60 - 71
    24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, // C7-B8 72 - 83
    36, 37, 38, 39, 40, 41, 42,                     // C8-F#9 84 - 90
];

const pedalKeyContacts = [ // mapping between pedal keys and drawbars
    // Pedal 0-24 (25 keys) C1-C3
    [0, 0], // C1   0 foldback
    [1, 1], // C#1  1 |
    [2, 2], // D1   2 |
    [3, 3], // D#1  3 V
    [4, 4], // E1   4
    [5, 5], // F1   5
    [6, 6], // F#1  6
    [7, 7], // G1   7
    [8, 8], // G#1  8 ^
    [9, 9], // A2   9 |
    [10, 10], // A#2 10 |
    [11, 11], // B2  11 foldback

    [0, 12], // C2  12
    [1, 13], // C#2 13
    [2, 14], // D2  14
    [3, 15], // D#2 15
    [4, 16], // E2  16
    [5, 17], // F2  17
    [6, 18], // F#2 18
    [7, 19], // G2  19
    [8, 20], // G#2 20
    [9, 21], // A3  21
    [10, 22], // A#3 22
    [11, 23], // B3  23

    [12, 24], // C3  24

];

const lowerKeyContacts = [ // mapping between lower manual keys and drawbars
    // Lower 0-61 (61 keys)
    [0, 19, 12, 24, 30, 36, 40, 43, 48], // C2   0
    [1, 20, 13, 25, 31, 37, 41, 44, 49], // C#2  1
    [2, 21, 14, 26, 32, 38, 42, 45, 50], // D2   2
    [3, 22, 15, 27, 33, 39, 43, 46, 51], // D#2  3
    [4, 23, 16, 28, 34, 40, 44, 47, 52], // E2   4
    [5, 24, 17, 29, 35, 41, 45, 48, 53], // F2   5
    [6, 25, 18, 30, 36, 42, 46, 49, 54], // F#2  6
    [7, 26, 19, 31, 37, 43, 47, 50, 55], // G2   7
    [8, 27, 20, 32, 38, 44, 48, 51, 56], // G#2  8
    [9, 28, 21, 33, 39, 45, 49, 52, 57], // A3   9
    [10, 29, 22, 34, 40, 46, 50, 53, 58], // A#3 10
    [11, 30, 23, 35, 41, 47, 51, 54, 59], // B3  11

    [12, 31, 24, 36, 42, 48, 52, 55, 60], // C3  12
    [13, 32, 25, 37, 43, 49, 53, 56, 61], // C#3 13
    [14, 33, 26, 38, 44, 50, 54, 57, 62], // D3  14
    [15, 34, 27, 39, 45, 51, 55, 58, 63], // D#3 15
    [16, 35, 28, 40, 46, 52, 56, 59, 64], // E3  16
    [17, 36, 29, 41, 47, 53, 57, 60, 65], // F3  17
    [18, 37, 30, 42, 48, 54, 58, 61, 66], // F#3 18
    [19, 38, 31, 43, 49, 55, 59, 62, 67], // G3  19
    [20, 39, 32, 44, 50, 56, 60, 63, 68], // G#3 20
    [21, 40, 33, 45, 51, 57, 61, 64, 69], // A4  21
    [22, 41, 34, 46, 52, 58, 62, 65, 70], // A#4 22
    [23, 42, 35, 47, 53, 59, 63, 66, 71], // B4  23

    [24, 43, 36, 48, 54, 60, 64, 67, 72], // C5  24
    [25, 44, 37, 49, 55, 61, 65, 68, 73], // C#5 25
    [26, 45, 38, 50, 56, 62, 66, 69, 74], // D5  26
    [27, 46, 39, 51, 57, 63, 67, 70, 75], // D#5 27
    [28, 47, 40, 52, 58, 64, 68, 71, 76], // E5  28
    [29, 48, 41, 53, 59, 65, 69, 72, 77], // F5  29
    [30, 49, 42, 54, 60, 66, 70, 73, 78], // F#5 30
    [31, 50, 43, 55, 61, 67, 71, 74, 79], // G5  31
    [32, 51, 44, 56, 62, 68, 72, 75, 80], // G#5 32
    [33, 52, 45, 57, 63, 69, 73, 76, 81], // A5  33
    [34, 53, 46, 58, 64, 70, 74, 77, 82], // A#5 34
    [35, 54, 47, 59, 65, 71, 75, 78, 83], // B5  35

    [36, 55, 48, 60, 66, 72, 76, 79, 84], // C6  36
    [37, 56, 49, 61, 67, 73, 77, 80, 85], // C#6 37
    [38, 57, 50, 62, 68, 74, 78, 81, 86], // D6  38
    [39, 58, 51, 63, 69, 75, 79, 82, 87], // D#6 39
    [40, 59, 52, 64, 70, 76, 80, 83, 88], // E6  40
    [41, 60, 53, 65, 71, 77, 81, 84, 89], // F6  41
    [42, 61, 54, 66, 72, 78, 82, 85, 90], // F#6 42
    [43, 62, 55, 67, 73, 79, 83, 86, 79], // G6  43 foldback
    [44, 63, 56, 68, 74, 80, 84, 87, 80], // G#6 44 |
    [45, 64, 57, 69, 75, 81, 85, 88, 81], // A7  45 |
    [46, 65, 58, 70, 76, 82, 86, 89, 82], // A#7 46 V
    [47, 66, 59, 71, 77, 83, 87, 90, 83], // B7  47

    [48, 67, 60, 72, 78, 84, 88, 79, 84], // C7  48
    [49, 68, 61, 73, 79, 85, 89, 80, 85], // C#7 49
    [50, 69, 62, 74, 80, 86, 90, 81, 86], // D7  50
    [51, 70, 63, 75, 81, 87, 79, 82, 87], // D#7 51
    [52, 71, 64, 76, 82, 88, 80, 83, 88], // E7  52
    [53, 72, 65, 77, 83, 89, 81, 84, 89], // F7  53
    [54, 73, 66, 78, 84, 90, 82, 85, 90], // F#7 54
    [55, 74, 67, 79, 85, 79, 83, 86, 79], // G7  55
    [56, 75, 68, 80, 86, 80, 84, 87, 80], // G#7 56
    [57, 76, 69, 81, 87, 81, 85, 88, 81], // A8  57 ^
    [58, 77, 70, 82, 88, 82, 86, 89, 82], // A#8 58 |
    [59, 78, 71, 83, 89, 83, 87, 90, 83], // B8  59 |

    [60, 79, 72, 84, 90, 84, 88, 79, 84], // C8  60 foldback

];

const upperKeyContacts = [ // mapping between upper manual keys and drawbars
    // Upper 0-61 (61 keys)
    [12, 19, 12, 24, 30, 36, 40, 43, 48], // C2   0 foldback
    [13, 20, 13, 25, 31, 37, 41, 44, 49], // C#2  1 |
    [14, 21, 14, 26, 32, 38, 42, 45, 50], // D2   2 |
    [15, 22, 15, 27, 33, 39, 43, 46, 51], // D#2  3 V
    [16, 23, 16, 28, 34, 40, 44, 47, 52], // E2   4
    [17, 24, 17, 29, 35, 41, 45, 48, 53], // F2   5
    [18, 25, 18, 30, 36, 42, 46, 49, 54], // F#2  6
    [19, 26, 19, 31, 37, 43, 47, 50, 55], // G2   7
    [20, 27, 20, 32, 38, 44, 48, 51, 56], // G#2  8 ^
    [21, 28, 21, 33, 39, 45, 49, 52, 57], // A3   9 |
    [22, 29, 22, 34, 40, 46, 50, 53, 58], // A#3 10 |
    [23, 30, 23, 35, 41, 47, 51, 54, 59], // B3  11 foldback

    [12, 31, 24, 36, 42, 48, 52, 55, 60], // C3  12
    [13, 32, 25, 37, 43, 49, 53, 56, 61], // C#3 13
    [14, 33, 26, 38, 44, 50, 54, 57, 62], // D3  14
    [15, 34, 27, 39, 45, 51, 55, 58, 63], // D#3 15
    [16, 35, 28, 40, 46, 52, 56, 59, 64], // E3  16
    [17, 36, 29, 41, 47, 53, 57, 60, 65], // F3  17
    [18, 37, 30, 42, 48, 54, 58, 61, 66], // F#3 18
    [19, 38, 31, 43, 49, 55, 59, 62, 67], // G3  19
    [20, 39, 32, 44, 50, 56, 60, 63, 68], // G#3 20
    [21, 40, 33, 45, 51, 57, 61, 64, 69], // A4  21
    [22, 41, 34, 46, 52, 58, 62, 65, 70], // A#4 22
    [23, 42, 35, 47, 53, 59, 63, 66, 71], // B4  23

    [24, 43, 36, 48, 54, 60, 64, 67, 72], // C5  24
    [25, 44, 37, 49, 55, 61, 65, 68, 73], // C#5 25
    [26, 45, 38, 50, 56, 62, 66, 69, 74], // D5  26
    [27, 46, 39, 51, 57, 63, 67, 70, 75], // D#5 27
    [28, 47, 40, 52, 58, 64, 68, 71, 76], // E5  28
    [29, 48, 41, 53, 59, 65, 69, 72, 77], // F5  29
    [30, 49, 42, 54, 60, 66, 70, 73, 78], // F#5 30
    [31, 50, 43, 55, 61, 67, 71, 74, 79], // G5  31
    [32, 51, 44, 56, 62, 68, 72, 75, 80], // G#5 32
    [33, 52, 45, 57, 63, 69, 73, 76, 81], // A5  33
    [34, 53, 46, 58, 64, 70, 74, 77, 82], // A#5 34
    [35, 54, 47, 59, 65, 71, 75, 78, 83], // B5  35

    [36, 55, 48, 60, 66, 72, 76, 79, 84], // C6  36
    [37, 56, 49, 61, 67, 73, 77, 80, 85], // C#6 37
    [38, 57, 50, 62, 68, 74, 78, 81, 86], // D6  38
    [39, 58, 51, 63, 69, 75, 79, 82, 87], // D#6 39
    [40, 59, 52, 64, 70, 76, 80, 83, 88], // E6  40
    [41, 60, 53, 65, 71, 77, 81, 84, 89], // F6  41
    [42, 61, 54, 66, 72, 78, 82, 85, 90], // F#6 42
    [43, 62, 55, 67, 73, 79, 83, 86, 79], // G6  43 foldback
    [44, 63, 56, 68, 74, 80, 84, 87, 80], // G#6 44 |
    [45, 64, 57, 69, 75, 81, 85, 88, 81], // A7  45 |
    [46, 65, 58, 70, 76, 82, 86, 89, 82], // A#7 46 V
    [47, 66, 59, 71, 77, 83, 87, 90, 83], // B7  47

    [48, 67, 60, 72, 78, 84, 88, 79, 84], // C7  48
    [49, 68, 61, 73, 79, 85, 89, 80, 85], // C#7 49
    [50, 69, 62, 74, 80, 86, 90, 81, 86], // D7  50
    [51, 70, 63, 75, 81, 87, 79, 82, 87], // D#7 51
    [52, 71, 64, 76, 82, 88, 80, 83, 88], // E7  52
    [53, 72, 65, 77, 83, 89, 81, 84, 89], // F7  53
    [54, 73, 66, 78, 84, 90, 82, 85, 90], // F#7 54
    [55, 74, 67, 79, 85, 79, 83, 86, 79], // G7  55
    [56, 75, 68, 80, 86, 80, 84, 87, 80], // G#7 56
    [57, 76, 69, 81, 87, 81, 85, 88, 81], // A8  57 ^
    [58, 77, 70, 82, 88, 82, 86, 89, 82], // A#8 58 |
    [59, 78, 71, 83, 89, 83, 87, 90, 83], // B8  59 |

    [60, 79, 72, 84, 90, 84, 88, 79, 84], // C8  60 foldback

];

const pedalDrawbarFrequencies = [
    90, // 0   16' Bourdon
    120, // 1   8' Principal
];

const lowerDrawbarFrequencies = [
    1000, // 0   16' Bourdon
    1300, // 1   5 1/3' Quint
    1200, // 2   8' Principal
    1500, // 3   4' Octave
    2000, // 4   2 2/3' Nazard
    3000, // 5   2' Block Floete
    4000, // 6   1 3/5' Tierce
    5000, // 7   1 1/3' Larigot
    6000, // 8   1' Sif Floete
];

const upperDrawbarFrequencies = [
    1000, // 0   16' Bourdon
    1300, // 1   5 1/3' Quint
    1200, // 2   8' Principal
    1500, // 3   4' Octave
    2000, // 4   2 2/3' Nazard
    3000, // 5   2' Block Floete
    4000, // 6   1 3/5' Tierce
    5000, // 7   1 1/3' Larigot
    6000, // 8   1' Sif Floete
];

// filter constants
const pedalDrawbarValues = [ // need 3dB per notch
    0.0, // 0   16' Bourdon
    0.0, // 1   8' Principal
];

var lowerDrawbarValues = [ // need 3dB per notch
    0.0, // 0   16' Bourdon
    0.0, // 1   5 1/3' Quint
    0.0, // 2   8' Principal
    0.0, // 3   4' Octave
    0.0, // 4   2 2/3' Nazard
    0.0, // 5   2' Block Floete
    0.0, // 6   1 3/5' Tierce
    0.0, // 7   1 1/3' Larigot
    0.0, // 8   1' Sif Floete
];

var upperDrawbarValues = [ // need 3dB per notch
    0.0, // 0   16' Bourdon
    0.0, // 1   5 1/3' Quint
    0.0, // 2   8' Principal
    0.0, // 3   4' Octave
    0.0, // 4   2 2/3' Nazard
    0.0, // 5   2' Block Floete
    0.0, // 6   1 3/5' Tierce
    0.0, // 7   1 1/3' Larigot
    0.0, // 8   1' Sif Floete
];
// TODO: The black preset key assignments

const drawbarPresets = [         // PRESET KEY  DRAWBARS    DESCRIPTION     LOUDNESS
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // C           None        Cancel          No sound
    [0, 0, 5, 3, 2, 0, 0, 0, 0], // Cs          00 5320 000 Stopped Flute   pp
    [0, 0, 4, 4, 3, 2, 0, 0, 0], // D           00 4432 000 Dulciana        ppp
    [0, 0, 8, 7, 4, 0, 0, 0, 0], // Ds          00 8740 000 French Horn     mf
    [0, 0, 4, 5, 4, 4, 2, 2, 2], // E           00 4544 222 Salicional      pp
    [0, 0, 5, 4, 0, 3, 0, 0, 0], // F           00 5403 000 Flutes 8' & 4'  p
    [0, 0, 4, 6, 7, 5, 3, 0, 0], // Fs          00 4675 300 Oboe            mf
    [0, 0, 5, 6, 4, 4, 3, 2, 0], // G           00 5644 320 Swell Diapason  mf
    [0, 0, 6, 8, 7, 6, 5, 4, 0], // Gs          00 6876 540 Trumpet         f
    [3, 2, 7, 6, 5, 4, 2, 2, 2], // A           32 7645 222 Full Swell      ff
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // As          Upper Left drawbars         No percussion
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // B           Upper Right drawbars        With percussion
];


class Generator {
    #oscNodes; // each tonewheel is emulated by a tone generator (oscillator)
    #directNodes;
    #leakNodes;

    // Create oscillators, i.e. 91 rotating tonewheels
    constructor(ctx, wheelMap, leakMap) {
        this.wheelMap = wheelMap;
        this.leakMap = leakMap;
        this.#oscNodes = [];
        this.#directNodes = []; // from osc to output
        this.#leakNodes = []; // from leaking osc to directNode
        this.wheelMap.forEach((wheel, index) => {
            this.#oscNodes.push(
                new OscillatorNode(ctx, {
                    frequency: wheel,
                    type: wheel < 64.0 ? "sine" : "sine", // for lowest notes we could replace sine with other waveform for complex sound
                })
            );
            this.#directNodes.push(
                new GainNode(ctx, {
                    gain: 1,
                })
            );
            this.#leakNodes.push(
                new GainNode(ctx, {
                    gain: 0,
                })
            );
            this.#oscNodes[index].connect(this.#directNodes[index]);
            //this.#leakNodes[index].connect(this.#directNodes[index]);
            // connecting other osc to leaknode to be done after this loop
        });
        //this.leakMap.filter(l => l >= 0).map((leak, index) => this.#oscNodes[index].connect(this.#leakNodes[leak]));
        return this;
    };

    start() { return this.#oscNodes.map(node => node.start()); };

    stop() { return this.#oscNodes.map(node => node.stop()); };

    set leak(l) { return this.#leakNodes.map(ln => ln.gain.value = l) };

    get leak() { return this.#leakNodes.map(ln => ln.gain.value) };

    get nodes() { return this.#directNodes; };

}; // class Generator

class Keyboard {
    #drawbarGainNodes;  // gain nodes one for each drawbar
    #filterNodes; // TODO: node to filter the step response from key on/off
    #constantNodes; // node controlled by each key to toggle note on or off
    #gainNodes; // nodes controlled by constantNode to toggle harmonics on or off

    constructor(ctx, oscillatorNodes, keyboardMap, filterValues) {
        this.keyboardMap = keyboardMap;
        this.#drawbarGainNodes = []; // amplifies according to drawbar setting
        this.#filterNodes = []; // low pass filter to soften the key on/off transition for constantNode
        this.keyboardMap[0].forEach((drawbar, drawbar_index) => {
            this.#drawbarGainNodes.push(new GainNode(ctx, {
                gain: 0,
            }));
            this.#filterNodes.push(new BiquadFilterNode(audioCtx, {
                type: "lowpass",
                Q: 0.5,
                frequency: filterValues[drawbar_index],
            }));
        });
        this.#constantNodes = []; // to control on/off gains for each key each connecting to the gain nodes
        this.#gainNodes = []; // contains one array of gainNodes as an array for each key
        this.keyboardMap.forEach((key, key_index) => {
            // each key

            this.#constantNodes.push(new ConstantSourceNode(audioCtx, {
                // controls all gainNodes for the key
                offset: 0, // 0 is key off, 1 is key on
            }));

            let tempGainNodes = [];
            key.forEach(osc => {
                //  [24, 43, 36, 48, 54, 60, 64, 67, 72], // C5  24
                // create the gate for each key
                tempGainNodes.push(
                    new GainNode(audioCtx, {
                        gain: 0, // keyValue[key_index]
                    })
                );
            });
            this.#gainNodes.push(tempGainNodes);
            // connect nodes internally and with source (oscNodes)
            key.forEach((osc, osc_index) => {
                this.#constantNodes[key_index].connect(this.#gainNodes[key_index][osc_index].gain);
                oscillatorNodes[osc].connect(this.#gainNodes[key_index][osc_index]);
                this.#gainNodes[key_index][osc_index].connect(this.#filterNodes[osc_index]);
                this.#filterNodes[osc_index].connect(this.#drawbarGainNodes[osc_index]);
            });
        });

    };

    start() { return this.#constantNodes.map(node => node.start()); };

    stop() { return this.#constantNodes.map(node => node.stop()); };

    keyOn(key) {
        // key is pressed
        if (key >= 0 && key < this.keyboardMap.length) {
            this.#constantNodes[key].offset.value = 1;
        } else console.error(`Keyboard keyOn: Invalid key: ${key}`);
    };

    keyOff(key) {
        // key is released
        if (key >= 0 && key < this.keyboardMap.length) {
            this.#constantNodes[key].offset.value = 0;
        } else console.error(`Keyboard keyOn: Invalid key: ${key}`);
    };

    connect(dest) {
        // connect keyboard to destination node
        return this.#drawbarGainNodes.map(node => node.connect(dest));
    };

    disconnect(dest) {
        // disconnect keyboard from destination
        return this.#drawbarGainNodes.map(node => node, disconnect(dest));
    };

    setDrawbarValue(drawbar, value) { this.#drawbarGainNodes[drawbar].gain.value = value < 0 ? 0 : value > 1 ? 1 : value; };

    getDrawbarValue(drawbar) { return this.#drawbarGainNodes[drawbar].gain.value; };

    get drawbars() { return this.#drawbarGainNodes.map(node => node.gain.value) };

    set drawbars(values) { return values.forEach((value, index) => this.#drawbarGainNodes[index].gain.value = value) };

    get keys() { return this.#constantNodes.map(key => key.offset.value) };

    set keys(values) { return values.forEach((value, index) => this.#constantNodes[index].offset.value = values) };

};
// class Keyboard

class Vibrato {
    constructor(ctx, sourceNode) {
        // for direct path used by chorus
        this.directNode = new GainNode(ctx, {
            gain: 0.0,
        });
        // the main scanner
        this.scanner = new OscillatorNode(audioCtx, {
            frequency: 0.0,
            type: "triangle",
        });
        // scanner swing
        this.swing = new GainNode(audioCtx, {
            gain: 0.0,
        });

        this.scanner.connect(this.swing);
        // delay in seconds for each tap; taps are parallel

        this.delayConstants = [   // 20 us steps
            0.000020, 0.000040, 0.000060, 0.000080, 0.000100, 0.000120, 0.000140, 0.000160,
            0.000180, 0.000200, 0.000220, 0.000240, 0.000260, 0.000280, 0.000300, 0.000320,
            0.000340,
        ];

        this.dn = []; // delay nodes
        this.gn = []; // gain nodes
        this.wsa = []; // waveshaper arrays
        this.wsn = []; // waveshaper nodes

        this.delayConstants.forEach((delayTime, index) => {
            this.dn.push(new DelayNode(audioCtx, {
                maxDelayTime: 0.02,
                delayTime: delayTime,
            }));
            this.gn.push(new GainNode(audioCtx, {
                gain: 0,
            }));
            this.wsa.push(new Float32Array([
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
                0,
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
            ]));
            this.wsa[index][index] = 0.5; // only set one entry to 1 per bucket for positive and one entry for negative
            this.wsa[index][32 - index] = 0.5;
            this.wsn.push(new WaveShaperNode(audioCtx, {
                curve: this.wsa[index],
                oversample: "4x", // "none",
            }));
            // sound path
            sourceNode.connect(this.dn[index]);
            this.dn[index].connect(this.gn[index]);

            // modulation path
            this.swing.connect(this.wsn[index]);
            // this.wsn[index].connect(this.gn[index].gain);
        });
    }; // constructor

    connect(dest) {
        // connect vibrato to destination node
        this.dest = dest;
        this.gn.forEach(node => node.connect(dest));
    };

    start() { return this.scanner.start(); };

    stop() { return this.scanner.stop(); };

    vibratoOn() { // switch on vibrato
        this.delayConstants.forEach((delayTime, index) => {
            this.wsn[index].connect(this.gn[index].gain);
        });
    };

    vibratoOff() {
        // switch off vibrato
        this.delayConstants.forEach((delayTime, index) => {
            this.wsn[index].disconnect(this.gn[index].gain);
        });
    };

    chorusOn() {
        // switch on chorus
        this.dn[8].connect(this.directNode).connect(this.dest);
    };

    chorusOff() {
        // switch off chorus
        this.directNode.disconnect(this.dest);
        this.dn[8].disconnect(this.directNode);
    };

    set speed(freq) { return this.scanner.frequency.value = freq; };

    get speed() { return this.scanner.frequency.value; };

    set depth(swing) { return this.swing.gain.value = swing; };

    get depth() { return this.swing.gain.value; };

    get chorus() { return this.directNode.gain.value; };

    set chorus(value) { return this.directNode.gain.value = value; };


};   // class Vibrato


class Leslie {
    constructor(ctx, sourceNode, clockwise) {

        // the main scanner
        this.scanner = new OscillatorNode(ctx, {
            frequency: 0.0,
            type: "sine",
        });
        // scanner swing
        this.swing = new GainNode(ctx, { // amplitude of scanner
            gain: 0.0,
        });
        // stereo panning
        this.panner = new StereoPannerNode(ctx, {
            pan: 0, // center
        });

        this.scanner.connect(this.swing);
        // delay in seconds for each tap; taps are parallel

        if (clockwise) {
            this.delayConstants = [   // 20 us steps
                0.000020, 0.000040, 0.000060, 0.000080, 0.000100, 0.000120, 0.000140, 0.000160,
                0.000180, 0.000200, 0.000220, 0.000240, 0.000260, 0.000280, 0.000300, 0.000320,
                0.000340,
            ]
        } else {
            this.delayConstants = [   // 20 us steps
                0.000020, 0.000040, 0.000060, 0.000080, 0.000100, 0.000120, 0.000140, 0.000160,
                0.000180, 0.000200, 0.000220, 0.000240, 0.000260, 0.000280, 0.000300, 0.000320,
                0.000340,
            ]
        };

        this.dn = []; // delay nodes
        this.gn = []; // gain nodes
        this.wsa = []; // waveshaper arrays
        this.wsn = []; // waveshaper nodes

        this.delayConstants.forEach((delayTime, index) => {
            this.dn.push(new DelayNode(ctx, {
                maxDelayTime: 0.02,
                delayTime: delayTime,
            }));
            this.gn.push(new GainNode(ctx, {
                gain: 0,
            }));
            this.wsa.push(new Float32Array([
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
                0,
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
            ]));
            this.wsa[index][index] = 1.0; // only set one entry to 1 per bucket for positive and one entry for negative
            this.wsa[index][32 - index] = 1.0;
            this.wsn.push(new WaveShaperNode(ctx, {
                curve: this.wsa[index],
                oversample: "4x", // "none",
            }));
            // sound path
            sourceNode.connect(this.dn[index]);
            this.dn[index].connect(this.gn[index]);

            // modulation path
            this.swing.connect(this.wsn[index]);
            //this.wsn[index].connect(this.gn[index]);
            this.gn[index].connect(this.panner);
        });
    }; // constructor

    connect(dest) {
        // connect leslie to destination node
        this.panner.connect(dest);
    };

    start() { return this.scanner.start(); };

    stop() { return this.scanner.stop(); };

    leslieOn() { // switch on leslie
        this.delayConstants.forEach((delayTime, index) => {
            this.wsn[index].connect(this.gn[index].gain);
        });
    };

    leslieOff() { // switch off leslie
        this.delayConstants.forEach((delayTime, index) => {
            this.wsn[index].disconnect(this.gn[index].gain);
        });
    };

    set speed(freq) { return this.scanner.frequency.value = freq; };

    get speed() { return this.scanner.frequency.value; };

    set depth(swing) { return this.swing.gain.value = swing; };

    get depth() { return this.swing.gain.value; };

};   // class Leslie

class Compressor {
    // dynamicly compress audio volume
    constructor(ctx, sourceNode) {
        this.compressor = new DynamicsCompressorNode(ctx, {
            attack: 0.5,
            knee: 20,
            ratio: 2, // 12,
            release: 0.25,
            threshold: -24,
        });
        sourceNode.connect(this.compressor);
    };

    connect(dest) { this.compressor.connect(dest); };

    disconnect(dest) { this.compressor.disconnect(dest); };

    set attack(a) { return this.compressor.attack.value = a; };

    get attack() { return this.compressor.attack.value; };

    set knee(a) { return this.compressor.knee.value = a; };

    get knee() { return this.compressor.knee.value; };

    set ratio(a) { return this.compressor.ratio.value = a; };

    get ratio() { return this.compressor.ratio.value; };

    set release(a) { return this.compressor.release.value = a; };

    get release() { return this.compressor.release.value; };

    set threshold(a) { return this.compressor.threshold.value = a; };

    get threshold() { return this.compressor.threshold.value; };

    get reduction() { return this.compressor.reduction; };

    get node() { return this.compressor; };


}; // class Compressor


// now build the organ

const toneGenerator = new Generator(audioCtx, toneWheels, leakMap);
const oscNodes = toneGenerator.nodes;

const upperNode = new GainNode(audioCtx, {
    gain: 1.0, // intermediate stage for upper manual only
});
const lowerNode = new GainNode(audioCtx, {
    gain: 1.0, // intermediate stage for lower manual only
});
const mergeNodeOrgan = new GainNode(audioCtx, {
    gain: 1, // final stage before leslie, controlled by swell pedal
});

const upper = new Keyboard(audioCtx, oscNodes, upperKeyContacts, upperDrawbarFrequencies);
upper.connect(upperNode);
const upperVibrato = new Vibrato(audioCtx, upperNode);
upperVibrato.connect(mergeNodeOrgan);

const lower = new Keyboard(audioCtx, oscNodes, lowerKeyContacts, lowerDrawbarFrequencies);
lower.connect(lowerNode);
const lowerVibrato = new Vibrato(audioCtx, lowerNode);
lowerVibrato.connect(mergeNodeOrgan);

const pedal = new Keyboard(audioCtx, oscNodes, pedalKeyContacts, pedalDrawbarFrequencies);
pedal.connect(mergeNodeOrgan);

const compressor = new Compressor(audioCtx, mergeNodeOrgan);

const highPassFilter = new BiquadFilterNode(audioCtx, {
    frequency: 400,
    type: "highpass",
    Q: 0.5, // 12 dB/oct Sallen-Key
});
compressor.node.connect(highPassFilter);

const lowPassFilter = new BiquadFilterNode(audioCtx, {
    frequency: 400,
    type: "lowpass",
    Q: 0.5,
});
compressor.node.connect(lowPassFilter);

const highLeslie = new Leslie(audioCtx, highPassFilter, true);
const lowLeslie = new Leslie(audioCtx, lowPassFilter, false);

function createReverb(ctx) {
    const convolver = new ConvolverNode(ctx, {
        normalize: true, // false,
    });
    return fetch("library/DomesticLivingRoom.wav")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then((buffer) => ctx.decodeAudioData(buffer))
        .then((decodedData) => {
            convolver.buffer = decodedData;
            return convolver;
        });
};

let rn; // kludge to get hold of reverb node, createReverb funnction should return rn
const reverb = createReverb(audioCtx)
    .then((r) => {
        highLeslie.connect(r);
        lowLeslie.connect(r);
        r.connect(audioCtx.destination);
        rn = r;
    });

function selectReverbResponse(reverbResponse, ctx) {
    return fetch("library/" + reverbResponse + ".wav")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} selecting ${reverbResponse}`);
            }
            return response.arrayBuffer();
        })
        .then((buffer) => ctx.decodeAudioData(buffer))
        .then((decodedData) => {
            return decodedData;
        });
};

function start() {  // executed when clicking start button
    console.log("Start clicked");
    if (audioCtx.state === 'suspended') {
        console.log("Audio Context was in suspended state");
        audioCtx.resume();
    };
    // start the machine !
    toneGenerator.start();
    upper.start();
    lower.start();
    pedal.start();
    upperVibrato.start();
    upperVibrato.vibratoOn();
    upperVibrato.chorusOn();
    lowerVibrato.start();
    lowerVibrato.vibratoOn();
    lowerVibrato.chorusOn();
    highLeslie.start();
    highLeslie.leslieOn();
    lowLeslie.start();
    lowLeslie.leslieOn();

    //  drawbar elements
    upper.drawbars.forEach((drawbar, index) => {
        document.getElementById("upper" + index).addEventListener("input", (event) => {
            upper.setDrawbarValue(index, event.target.value / 100); // range: 0 .. 9 -> 0.00 .. 0.09
        });
    });
    lower.drawbars.forEach((drawbar, index) => {
        document.getElementById("lower" + index).addEventListener("input", (event) => {
            lower.setDrawbarValue(index, event.target.value / 100); // range: 0 .. 9 -> 0.00 .. 0.09
        });
    });
    pedal.drawbars.forEach((drawbar, index) => {
        document.getElementById("pedal" + index).addEventListener("input", (event) => {
            pedal.setDrawbarValue(index, event.target.value / 100); // range: 0 .. 9 -> 0.00 .. 0.09
        });
    });

    // vibrato and chorus elements
    document.getElementById("upperVibratoFreq").addEventListener("input", (event) => {
        upperVibrato.speed = event.target.value; // 0 .. 10
    });
    document.getElementById("upperVibratoDepth").addEventListener("input", (event) => {
        upperVibrato.depth = event.target.value; // 0 .. 1
    });
    document.getElementById("upperChorus").addEventListener("input", (event) => {
        upperVibrato.chorus = event.target.value; // 0 .. 1
    });

    document.getElementById("lowerVibratoFreq").addEventListener("input", (event) => {
        lowerVibrato.speed = event.target.value; // 0 .. 10
    });
    document.getElementById("lowerVibratoDepth").addEventListener("input", (event) => {
        lowerVibrato.depth = event.target.value; // 0 .. 1
    });
    document.getElementById("lowerChorus").addEventListener("input", (event) => {
        lowerVibrato.chorus = event.target.value; // 0 .. 1
    });

    // Leslie elements
    document.getElementById("leslieFreq").addEventListener("input", (event) => {
        highLeslie.speed = event.target.value; // 0 .. 10
        lowLeslie.speed = event.target.value;
    });
    document.getElementById("leslieDepth").addEventListener("input", (event) => {
        highLeslie.depth = event.target.value; // 0 .. 1
        lowLeslie.depth = event.target.value; // 0 .. 1
    });

    // reverb elements
    document.getElementById("reverbs").addEventListener("input", (event) => {
        console.log("reverbs: ", event.target.value);
        selectReverbResponse(event.target.value, audioCtx).then(b => rn.buffer = b);
    });

    // start button to green
    const startButton = document.getElementById("start");
    startButton.style.backgroundColor = "green";
    startButton.textContent = "Running";

};

/*
const adsrCurve = new Float32Array([0.1, 0.1, 0.8, 1.0]); // Attack (seconds), Decay (seconds), Sustain (level), Release (seconds)
const attackUpper = (key, attackTime, decayTime, sustainLevel) => {
    constantNodeUpper[key].offset.setValueAtTime(0, audioCtx.currentTime);
    constantNodeUpper[key].offset.linearRampToValueAtTime(1, audioCtx.currentTime + attackTime);
    constantNodeUpper[key].offset.linearRampToValueAtTime(sustainLevel, audioCtx.currentTime + attackTime + decayTime);
};
const releaseUpper = (key, releaseTime) => {
    constantNodeUpper[key].offset.linearRampToValueAtTime(0, audioCtx.currentTime + releaseTime);
};
*/

function testMidi() {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
};

function onMIDISuccess(midiAccess) {
    console.log('This browser supports WebMIDI!');
    console.log(midiAccess);
    var inputs = midiAccess.inputs;
    console.log(inputs);
    console.log(inputs.size);
    var outputs = midiAccess.outputs;
    console.log(outputs);
    document.getElementById("midi").style.backgroundColor = "green";
    document.getElementById("upper").checked = true;
    midiMapState = 1; // Upper manual as default
    for (var input of midiAccess.inputs.values()) input.onmidimessage = getMIDIMessage;
};

function onMIDIFailure() {
    console.log('WebMIDI is not supported in this browser.');
    document.getElementById("midi").style.backgroundColor = "red";
};

function getMIDIMessage(message) {
    // if (message.data[0] != 248 && message.data[0] != 254) console.log(message);

    const command = message.data[0];
    const note = message.data[1];
    const velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

    switch (command) {
        case 226:  // ? pitch bend wheel?? 226,126,127 -> 226,0,64 -> 226,0,0
            console.log(command, note, velocity);
            swell(note, velocity);
            break;
        case 144: // noteOn
            if (velocity > 0) {
                noteOn(note, velocity);
            } else {
                noteOff(note);
            }
            break;
        case 128: // noteOff
            noteOff(note);
            break;
        // we could easily expand this switch statement to cover other types of commands such as controllers or sysex
    };
};

function noteOn(note, velocity) {
    console.log("noteOn: ", note, velocity);
    if (midiMapState > 0 && note >= 24 && note < 36) {
        pedal.keyOn(note - 24);
    } else {
        midiMapState == 1 ? upper.keyOn(note - 36) :
            midiMapState == 2 ? lower.keyOn(note - 36) :
                midiMapState == 3 ? pedal.keyOn(note - 36) : console.error("Invalid midiMapState");
    }
};

function noteOff(note) {
    console.log("noteOff: ", note);
    if (midiMapState > 0 && note >= 24 && note < 36) {
        pedal.keyOff(note - 24);
    } else {
        midiMapState == 1 ? upper.keyOff(note - 36) :
            midiMapState == 2 ? lower.keyOff(note - 36) :
                midiMapState == 3 ? pedal.keyOff(note - 36) : console.error("Invalid midiMapState");
    }
};

function swell(lsb, msb) {
    mergeNodeOrgan.gain.value = (128 * msb + lsb) / 8192.0;
}

function midiMap(state) {
    if (state == 0) midiMapState = 0; // none
    if (state == 1) midiMapState = 1; // upper
    if (state == 2) midiMapState = 2; // lower
    if (state == 3) midiMapState = 3; // pedal
}
