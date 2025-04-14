// Third i Website - Three.js Implementation
document.addEventListener('DOMContentLoaded', function() {
  // --- Global Variables ---
  let scene, camera, renderer; // Core Three.js components
  let cube = {}; // Object to hold references to cube wall meshes
  let currentWall = 'center'; // Tracks the currently viewed wall ('left', 'center', 'right')
  let targetRotationY = 0; // Target Y rotation for camera animation
  let currentRotationY = 0; // Current interpolated Y rotation of camera
  let isAnimating = false; // Flag to prevent overlapping navigation animations

  // --- Core Constants ---
  const MIN_W = 36;        // Minimum wall width
  const MED_W = 54;        // Medium wall width
  const MAX_W = 72;        // Maximum wall width
  const MIN_H = 23;        // Minimum wall height (landscape)
  const MAX_H = 47;        // Maximum wall height (portrait)
  const BASE_H = 23;       // Base wall height
  const REFERENCE_WIDTH = 1000; // Reference window width in pixels
  const WORLD_UNITS_PER_REF = 50; // How many world units at reference width
  const WALL_WIDTH_RATIO = 0.9; // Wall takes 90% of viewport width
  
  // --- Camera & FOV Constants ---
  const baseFOV = 112;      // Base FOV reference (not used in new calculation)
  const minFOV = 42;        // Minimum FOV (for widest screens)
  const maxFOV = 92;        // Maximum FOV (for narrowest screens)
  const MIN_WINDOW_WIDTH = 260; // Ensures 92° FOV at narrowest width
  const MAX_WINDOW_WIDTH = REFERENCE_WIDTH; // Uses original reference for wide width
  const universalCameraPullback = 0; // Reset to 0 to center camera between walls
  
  // --- View State Tracking ---
  let refAspectRatio;      // Reference aspect ratio, set in init()
  let currentFOV = baseFOV;
  let currentCamZ = 0;
  let currentFrontShift = 0;
  
  // --- View-specific Settings ---
  const sideWallCameraAdjustment = {
    center: { 
      z: 0,            // No Z offset for center
      x: 0,            // No X offset for center
      frontShift: 0,   // No front shift for center
      frontShiftNarrowFactor: 0,
      fovAdjust: -25   // Additional zoom for center view
    },
    left: {
      z: 12,           // Base Z offset
      x: 4,            // Wider X offset
      frontShift: -8,  // Moved camera forward
      frontShiftNarrowFactor: -30,
      forwardShift: 8  // Push camera forward
    },
    right: {
      z: 12,           // Base Z offset
      x: -4,           // Wider X offset
      frontShift: -8,  // Moved camera forward
      frontShiftNarrowFactor: -30,
      forwardShift: 8  // Push camera forward
    }
  };

  // --- Geometry References ---
  // Need to store references to dispose of old geometries on resize
  let frontGeometry, leftGeometry, rightGeometry, backGeometry, topGeometry, bottomGeometry;

  // --- DOM Element References ---
  const environment = document.getElementById('cube-environment'); // Main container for the 3D scene
  const container = document.getElementById('cube-container'); // Inner container holding the canvas
  const innerContainer = document.querySelector('.cube-inner-container');
  const canvas = document.getElementById('three-canvas'); // The WebGL canvas element
  const wallContents = { // References to HTML content divs for each wall
    center: document.getElementById('wall-content-center'),
    left: document.getElementById('wall-content-left'),
    right: document.getElementById('wall-content-right')
  };
  const navLeft = document.querySelector('.nav-hint-left'); // Left navigation arrow
  const navRight = document.querySelector('.nav-hint-right'); // Right navigation arrow

  // Global texture reference
  let starTexture = null;

  // Mobile Menu Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mobileNav.classList.toggle('active');
  });

  // ============================================
  // == INITIALIZATION & SCENE SETUP          ==
  // ============================================

  // Initialize Three.js scene, camera, renderer, lighting, and initial cube
  function init() {
    // Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Set background to black

    // Store initial aspect ratio for reference in resizing calculations
    refAspectRatio = innerContainer.clientWidth / innerContainer.clientHeight;

    // Create Camera (Perspective)
    // FOV starts at baseFOV and aspect ratio uses reference initially
    camera = new THREE.PerspectiveCamera(baseFOV, refAspectRatio, 0.1, 500);
    camera.position.set(0, 0, 0); // Place camera exactly at origin (center of cube)
    camera.lookAt(0, 0, -1); // Look towards the negative Z-axis (front wall)

    // Create WebGL Renderer
    renderer = new THREE.WebGLRenderer({
      canvas, // Render onto the existing canvas
      antialias: true, // Enable antialiasing for smoother edges
      alpha: true // Allow transparency (if needed)
    });
    renderer.setSize(innerContainer.clientWidth, innerContainer.clientHeight); // Set initial size
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Adjust for high-DPI screens

    // Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Directional light for highlights
    directionalLight.position.set(0, 1, 1); // Positioned slightly above and behind
    scene.add(directionalLight);

    // Load texture first, then create cube
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'Images/Backgrounds/backgroundSimpleStars.png',
      (texture) => {
        starTexture = texture;
        starTexture.wrapS = THREE.RepeatWrapping;
        starTexture.wrapT = THREE.RepeatWrapping;
        // Simple 1:1 repeat, let it stretch
        starTexture.repeat.set(1, 1);
        createCube();  // Only create cube after texture is loaded
        onWindowResize();  // Initial resize
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        starTexture = null;
        createCube();  // Create cube anyway, but without texture
        onWindowResize();
      }
    );

    // Add window resize listener
    window.addEventListener('resize', onWindowResize);

    // Set up zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
      adjustZoom(-5); // Decrease FOV to zoom in
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
      adjustZoom(5); // Increase FOV to zoom out
    });
    
    // Initial display
    updateZoomDisplay();

    // Start the animation loop
    animate();
  }

  // ============================================
  // == CUBE CREATION                         ==
  // ============================================

  // Creates the initial 6 walls (meshes) of the cube
  function createCube() {
    // Create unit geometries (1x1)
    frontGeometry = new THREE.PlaneGeometry(1, 1);
    leftGeometry = new THREE.PlaneGeometry(1, 1);
    rightGeometry = new THREE.PlaneGeometry(1, 1);
    backGeometry = new THREE.PlaneGeometry(1, 1);
    topGeometry = new THREE.PlaneGeometry(1, 1);
    bottomGeometry = new THREE.PlaneGeometry(1, 1);

    // Create materials
    const frontMaterial = new THREE.MeshBasicMaterial({ 
      map: starTexture,
      color: starTexture ? 0xffffff : 0x000000,
      side: THREE.DoubleSide 
    });
    const leftMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000066,
      side: THREE.DoubleSide 
    });
    const rightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x660000,
      side: THREE.DoubleSide 
    });
    const backMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      side: THREE.DoubleSide 
    });
    const topMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      side: THREE.DoubleSide 
    });
    const bottomMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      side: THREE.DoubleSide 
    });

    // Create meshes
    cube.front = new THREE.Mesh(frontGeometry, frontMaterial);
    cube.left = new THREE.Mesh(leftGeometry, leftMaterial);
    cube.right = new THREE.Mesh(rightGeometry, rightMaterial);
    cube.back = new THREE.Mesh(backGeometry, backMaterial);
    cube.top = new THREE.Mesh(topGeometry, topMaterial);
    cube.bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);

    // Set initial rotations
    cube.left.rotation.y = Math.PI / 2;
    cube.right.rotation.y = -Math.PI / 2;
    cube.back.rotation.y = Math.PI;
    cube.top.rotation.x = -Math.PI / 2;
    cube.bottom.rotation.x = Math.PI / 2;

    // Add to scene
    Object.values(cube).forEach(wall => scene.add(wall));
  }

  // ============================================
  // == WINDOW RESIZE HANDLING                ==
  // ============================================

  // Handles dynamic resizing of the cube environment when the browser window changes size.
  function onWindowResize() {
    const windowWidth = innerContainer.clientWidth;
    const windowHeight = innerContainer.clientHeight;
    const windowAspect = windowWidth / windowHeight;
    
    // PLAN 1: Simple, direct wall width scaling
    // Convert window width to world units and apply ratio
    const wallWidth = (windowWidth / REFERENCE_WIDTH) * WORLD_UNITS_PER_REF * WALL_WIDTH_RATIO;
    
    // PLAN 2: Responsive wall height (landscape to portrait)
    // Define aspect ratio breakpoints for clear transitions
    const wideAspectThreshold = 1.5;  // Landscape mode
    const narrowAspectThreshold = 1.0; // Portrait mode
    
    let wallHeight;
    if (windowAspect >= wideAspectThreshold) {
      // Landscape mode (wide window)
      wallHeight = MIN_H;
    } else if (windowAspect <= narrowAspectThreshold) {
      // Portrait mode (narrow window)
      wallHeight = MAX_H;
    } else {
      // Smooth transition between landscape and portrait
      const transitionProgress = (wideAspectThreshold - windowAspect) / (wideAspectThreshold - narrowAspectThreshold);
      wallHeight = MIN_H + (MAX_H - MIN_H) * transitionProgress;
    }
    
    console.log(`Window: ${windowWidth}x${windowHeight}, Aspect: ${windowAspect.toFixed(2)}, Wall: ${wallWidth.toFixed(1)}x${wallHeight.toFixed(1)}`);
    
    // Apply dimensions to walls
    Object.values(cube).forEach(wall => {
      if (wall === cube.top || wall === cube.bottom) {
        wall.scale.set(wallWidth, wallWidth, 1);  // Keep top/bottom square
      } else {
        wall.scale.set(wallWidth, wallHeight, 1); // Set width and height for side walls
      }
    });
    
    // Update wall positions to maintain cube structure
    cube.front.position.z = -wallWidth / 2;
    cube.back.position.z = wallWidth / 2;
    cube.left.position.x = -wallWidth / 2;
    cube.right.position.x = wallWidth / 2;
    cube.top.position.y = wallHeight / 2;
    cube.bottom.position.y = -wallHeight / 2;
    
    // Simple texture stretch
    if (starTexture && cube.front.material.map) {
      starTexture.repeat.set(1, 1);
      starTexture.offset.set(0, 0);
      starTexture.needsUpdate = true;
      cube.front.material.needsUpdate = true;
    }
    
    // Calculate FOV based on window width
    console.log(`Current window width: ${windowWidth}px`);
    
    // Constrain window width to our min/max range
    const constrainedWidth = Math.max(MIN_WINDOW_WIDTH, Math.min(MAX_WINDOW_WIDTH, windowWidth));
    
    // Calculate normalized position within the window width range (0 = narrowest, 1 = widest)
    const normalizedWidth = (constrainedWidth - MIN_WINDOW_WIDTH) / (MAX_WINDOW_WIDTH - MIN_WINDOW_WIDTH);
    
    // Directly calculate FOV - linear interpolation from maxFOV (narrow) to minFOV (wide)
    currentFOV = maxFOV - (maxFOV - minFOV) * normalizedWidth;
    
    // Ensure FOV stays within bounds even if window gets extremely narrow or wide
    currentFOV = Math.max(minFOV, Math.min(maxFOV, currentFOV));
    
    // Update camera
    camera.fov = currentFOV;
    camera.aspect = windowAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(windowWidth, windowHeight);
    
    // Update zoom display
    updateZoomDisplay();
    
    // Render the scene
    renderer.render(scene, camera);
  }

  // ============================================
  // == ANIMATION LOOP                        ==
  // ============================================

  // The main animation loop, called every frame
  function animate() {
    requestAnimationFrame(animate); // Request the next frame

    // --- Smooth Camera Rotation (Interpolation) ---
    // Only interpolate if not currently using GSAP animation
    if (!isAnimating && Math.abs(currentRotationY - targetRotationY) > 0.01) {
      // Gradually move current rotation towards the target rotation
      currentRotationY += (targetRotationY - currentRotationY) * 0.1; // Simple easing
      camera.rotation.y = currentRotationY; // Apply the interpolated rotation
    }

    // --- Render the Scene ---
    renderer.render(scene, camera); // Render the scene with the current camera view
  }

  // ============================================
  // == NAVIGATION & INTERACTION              ==
  // ============================================

  // Animates the camera rotation to face the target wall ('left', 'center', 'right')
  function navigateToWall(wall) {
    if (isAnimating) return; // Prevent starting a new animation while one is running
    isAnimating = true; // Set animation flag

    const previousWall = currentWall; // Store the wall we are coming from
    currentWall = wall; // Update the current wall state

    // Determine target camera Y rotation based on the destination wall
    if (wall === 'left') {
      targetRotationY = Math.PI / 2; // 90 degrees
    } else if (wall === 'right') {
      targetRotationY = -Math.PI / 2; // -90 degrees
    } else { // Center wall
      targetRotationY = 0; // 0 degrees
    }

    // ONLY animate camera rotation - no position change
    gsap.to(camera.rotation, {
      y: targetRotationY,
      duration: 1.0,
      ease: "power2.inOut",
      onComplete: function() {
        isAnimating = false; // Reset animation flag when done
        updateWallContent(previousWall, wall); // Update wall content
      }
    });
  }

  // Shows the HTML content for the new wall and hides the content for the previous wall
  function updateWallContent(prevWall, newWall) {
    // Hide previous wall content if it exists
    if (wallContents[prevWall]) {
      wallContents[prevWall].classList.remove('active');
    }
    // Show new wall content if it exists
    if (wallContents[newWall]) {
      wallContents[newWall].classList.add('active');
    }
  }

  // Sets up event listeners for user interaction (clicks, swipes, keyboard)
  function setupEventListeners() {
    let startX; // Stores the starting X coordinate for drag/swipe
    let isDragging = false; // Tracks if the user is currently dragging/swiping

    // --- Navigation Button Clicks ---
    navLeft.addEventListener('click', function() {
      if (currentWall === 'right') navigateToWall('center');
      else if (currentWall === 'center') navigateToWall('left');
    });
    navRight.addEventListener('click', function() {
      if (currentWall === 'left') navigateToWall('center');
      else if (currentWall === 'center') navigateToWall('right');
    });

    // --- Mouse Drag Events ---
    container.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX;
      e.preventDefault(); // Prevent default text selection behavior
    });
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const threshold = 50; // Minimum drag distance to trigger navigation
      if (deltaX > threshold) { // Dragged right
        if (currentWall === 'right') navigateToWall('center');
        else if (currentWall === 'center') navigateToWall('left');
        isDragging = false; // Reset drag after navigation
      } else if (deltaX < -threshold) { // Dragged left
        if (currentWall === 'left') navigateToWall('center');
        else if (currentWall === 'center') navigateToWall('right');
        isDragging = false; // Reset drag after navigation
      }
    });
    document.addEventListener('mouseup', function() {
      isDragging = false; // Stop dragging on mouse up
    });

    // --- Touch Swipe Events (for Mobile) ---
    container.addEventListener('touchstart', function(e) {
      isDragging = true;
      startX = e.touches[0].clientX;
    }, { passive: true }); // Use passive listener for better scroll performance
    document.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      const touchCurrentX = e.touches[0].clientX;
      const deltaX = touchCurrentX - startX;
      const threshold = 30; // Lower threshold for touch
      if (deltaX > threshold) { // Swiped right
        if (currentWall === 'right') navigateToWall('center');
        else if (currentWall === 'center') navigateToWall('left');
        isDragging = false;
      } else if (deltaX < -threshold) { // Swiped left
        if (currentWall === 'left') navigateToWall('center');
        else if (currentWall === 'center') navigateToWall('right');
        isDragging = false;
      }
    }, { passive: true });
    document.addEventListener('touchend', function() {
      isDragging = false; // Stop swiping on touch end
    });

    // --- Double Click to Center ---
    container.addEventListener('dblclick', function() {
      if (currentWall !== 'center') {
        navigateToWall('center');
      }
    });

    // --- Keyboard Navigation (Arrow Keys) ---
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        if (currentWall === 'right') navigateToWall('center');
        else if (currentWall === 'center') navigateToWall('left');
      } else if (e.key === 'ArrowRight') {
        if (currentWall === 'left') navigateToWall('center');
        else if (currentWall === 'center') navigateToWall('right');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Optional: Could implement navigation to top/bottom walls if needed
      }
    });
  }

  // Adjust zoom level
  function adjustZoom(amount) {
    // Limit FOV between 30 and 150 degrees
    currentFOV = Math.max(30, Math.min(150, currentFOV + amount));
    camera.fov = currentFOV;
    camera.updateProjectionMatrix();
    updateZoomDisplay();
    renderer.render(scene, camera);
  }

  // Update zoom display
  function updateZoomDisplay() {
    document.getElementById('zoom-value').textContent = `${Math.round(currentFOV)}°`;
  }

  // ============================================
  // == MISC & INITIAL EXECUTION              ==
  // ============================================

  // Simple header scroll effect (if header exists and is fixed)
  const header = document.querySelector('header');
  if (header && getComputedStyle(header).position === 'fixed') {
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop) {
        header.style.top = '-80px'; // Hide header on scroll down
      } else {
        header.style.top = '0'; // Show header on scroll up
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    });
  }

  // --- Initial Setup Execution ---
  init(); // Initialize the Three.js scene etc.
  setupEventListeners(); // Set up user interaction listeners
  updateWallContent(null, 'center'); // Ensure center wall content is active initially
});
