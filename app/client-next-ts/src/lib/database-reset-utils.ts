// Database reset utilities for triggering component refetch
export const DatabaseResetUtils = {
  // Emulate browser tab switch events to trigger component refetch
  emulateTabSwitch: () => {
    console.log('Emulating browser tab switch events...');

    // Simulate the sequence of events that occur when switching browser tabs:
    // 1. Page becomes hidden (visibilitychange event)
    // 2. Window loses focus (blur event)
    // 3. Short delay
    // 4. Page becomes visible again (visibilitychange event)
    // 5. Window gains focus (focus event)

    // Step 1: Simulate page becoming hidden
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });

    window.dispatchEvent(new Event('visibilitychange'));

    // Step 2: Simulate window losing focus
    window.dispatchEvent(new Event('blur'));

    // Step 3: Short delay to simulate time spent in other tab
    setTimeout(() => {
      // Step 4: Simulate page becoming visible again
      Object.defineProperty(document, 'hidden', {
        value: false,
        configurable: true,
      });
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      window.dispatchEvent(new Event('visibilitychange'));

      // Step 5: Simulate window gaining focus
      window.dispatchEvent(new Event('focus'));

      console.log(
        'Tab switch emulation complete - all embedded components should refetch'
      );
    }, 100);
  },

  // Reset database for a specific scenario
  resetDatabaseForScenario: async (
    scenario: string,
    setIsLoading: (loading: boolean) => void
  ) => {
    setIsLoading(true);

    try {
      // Call the MSW reset endpoint
      const response = await fetch('/ef/do/v1/_reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario }),
      });

      const data = await response.json();
      console.log('Database reset successful:', data);

      // Emulate tab switch event after 300ms to trigger refetch in all embedded components
      setTimeout(() => {
        DatabaseResetUtils.emulateTabSwitch();
        // Clear loading state after tab switch emulation
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }, 300);
    } catch (error) {
      console.error('Database reset failed:', error);
      setIsLoading(false);
    }
  },
};
