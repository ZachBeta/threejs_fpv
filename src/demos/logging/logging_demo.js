import { RoutineDemo } from '../../routine_demo.js';

let demo = null;

export function initializeDemo() {
    console.log('Initializing demo...');
    if (!demo) {
        console.log('Creating new RoutineDemo instance');
        demo = new RoutineDemo();
    } else {
        console.log('Using existing RoutineDemo instance');
    }
    return demo;
}

export function startDemo() {
    console.log('Starting demo...');
    if (!demo) {
        console.log('No demo instance found, initializing...');
        demo = initializeDemo();
    }
    console.log('Calling startRoutine()');
    demo.startRoutine();
    console.log('Demo started, isRunning:', demo.isRoutineRunning);
    return demo;
}

export function stopDemo() {
    console.log('Stopping demo...');
    if (demo) {
        console.log('Found demo instance, calling stopRoutine()');
        demo.stopRoutine();
        console.log('Demo stopped, isRunning:', demo.isRoutineRunning);
    } else {
        console.log('No demo instance found to stop');
    }
}

export function isDemoRunning() {
    const running = demo ? demo.isRoutineRunning : false;
    console.log('Checking if demo is running:', running);
    return running;
} 