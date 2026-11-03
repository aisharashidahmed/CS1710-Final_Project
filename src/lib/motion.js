import { cubicOut } from 'svelte/easing';

// Length of chart transitions. Readers who ask for less motion get none.
const reduceMotion =
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const DURATION = reduceMotion ? 0 : 500;
export const easing = cubicOut;
