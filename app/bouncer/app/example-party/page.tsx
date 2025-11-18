'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { PartyProvider, GuestProvider, RSVPProvider, useParty, useGuest, useRSVP } from '../../lib/providers';

const treeBackgroundBaseStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(253, 251, 247, 0.9), rgba(253, 251, 247, 0.9)), url("/tree-branch.jpg")',
  backgroundRepeat: 'no-repeat, no-repeat',
  backgroundSize: '100% 100%, auto',
  backgroundPosition: 'center, top right',
};

type TreeBackgroundProps = React.HTMLAttributes<HTMLDivElement>;

function TreeBackground({ className = '', style, children, ...rest }: TreeBackgroundProps) {
  return (
    <div
      className={className}
      style={{ ...treeBackgroundBaseStyle, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

function AnimatedRectangles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {/* Horizontal sliding bars */}
      <div className="absolute top-[15%] left-[10%] w-32 h-1 bg-orange-400 animate-slide-h" />
      <div className="absolute top-[15%] left-[18%] w-24 h-1 bg-orange-500 animate-slide-h" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-[18%] left-[12%] w-28 h-1 bg-amber-500 animate-slide-h" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[21%] left-[15%] w-20 h-1 bg-orange-600 animate-slide-h" style={{ animationDelay: '1.5s' }} />

      {/* Vertical sliding bars */}
      <div className="absolute top-[40%] right-[15%] w-1 h-32 bg-orange-400 animate-slide-v" />
      <div className="absolute top-[35%] right-[18%] w-1 h-24 bg-orange-500 animate-slide-v" style={{ animationDelay: '0.7s' }} />
      <div className="absolute top-[42%] right-[12%] w-1 h-28 bg-amber-500 animate-slide-v" style={{ animationDelay: '1.2s' }} />

      {/* Bottom horizontal bars */}
      <div className="absolute bottom-[20%] right-[20%] w-36 h-1 bg-orange-400 animate-slide-h" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[23%] right-[25%] w-28 h-1 bg-orange-500 animate-slide-h" style={{ animationDelay: '2.5s' }} />
      <div className="absolute bottom-[26%] right-[22%] w-32 h-1 bg-amber-600 animate-slide-h" style={{ animationDelay: '3s' }} />
    </div>
  );
}

function InteractiveDotGrid() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [dots, setDots] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const createDots = () => {
      // Create dot positions based on grid - larger spacing for fewer dots
      const spacing = 48;
      const dotsArray = [];
      const cols = Math.ceil(window.innerWidth / spacing);
      const rows = Math.ceil(window.innerHeight / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dotsArray.push({ x: i * spacing, y: j * spacing });
        }
      }
      setDots(dotsArray);
    };

    createDots();

    // Add resize listener
    const handleResize = () => {
      createDots();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setMousePos({ x: e.clientX, y: e.clientY });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const maxDistance = 120;
  const maxDistanceSq = maxDistance * maxDistance; // Use squared distance to avoid sqrt

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((dot, i) => {
        const dx = mousePos.x - dot.x;
        const dy = mousePos.y - dot.y;
        const distanceSq = dx * dx + dy * dy;

        // Skip calculation if too far away
        if (distanceSq > maxDistanceSq) {
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-gray-300/50"
              style={{
                left: dot.x,
                top: dot.y,
              }}
            />
          );
        }

        const distance = Math.sqrt(distanceSq);
        const scale = 1 + (1 - distance / maxDistance) * 1.5;

        return (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-gray-300/50"
            style={{
              left: dot.x,
              top: dot.y,
              transform: `scale(${scale})`,
              transition: 'transform 0.1s ease-out',
            }}
          />
        );
      })}
    </div>
  );
}

function CodeEntryForm({ onValidCode }: { onValidCode: (code: string) => void }) {
  const { validateCode, loading, error } = useParty();
  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const isValid = await validateCode(code.trim());
    if (isValid) {
      onValidCode(code.trim());
    } else {
      setValidationError('Invalid invitation code. Please check and try again.');
    }
  };

  return (
    <TreeBackground className="min-h-screen bg-[#fdfbf7] flex items-center relative overflow-hidden fall-texture">
      {/* Interactive dot grid background */}
      <InteractiveDotGrid />

      {/* Animated rectangles */}
      <AnimatedRectangles />

      <div className="w-full max-w-7xl mx-auto px-8 py-12 md:py-16 lg:py-20 relative z-10 min-h-screen flex items-center">
        <div className="w-full space-y-2 md:space-y-4 lg:space-y-8">
          <motion.header
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] leading-none font-semibold text-amber-950 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              sanjay.party
            </motion.h1>
            <motion.div
              className="flex items-baseline gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light text-orange-600">
                Invitation
              </div>
            </motion.div>
          </motion.header>

          <motion.main
            className="max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-16">
              <div className="space-y-6">
                <p className="text-amber-950 text-xl">
                  Enter your invitation code to continue
                </p>
                <motion.input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="w-full px-0 py-6 bg-transparent text-4xl md:text-5xl lg:text-6xl font-light tracking-wide uppercase focus:outline-none placeholder:text-gray-200 text-amber-950 border-b-2 border-gray-900"
                  disabled={loading}
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {(validationError || error) && (
                <motion.p
                  className="text-red-500 text-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {validationError || error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading || !code.trim()}
                className="text-amber-950 text-lg hover:text-orange-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Validating...' : 'Continue →'}
              </motion.button>
            </form>
          </motion.main>

          <motion.footer
            className="pt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-gray-500 text-base">
              You are invited to something special
            </p>
          </motion.footer>
        </div>
      </div>
    </TreeBackground>
  );
}

function Confirmation() {
  const { party } = useParty();
  const { formData } = useRSVP();

  const isAccepted = formData.rsvpStatus === 'accepted';

  return (
    <TreeBackground className="min-h-screen bg-[#fdfbf7] relative overflow-hidden">
      {/* Interactive dot grid background */}
      <InteractiveDotGrid />

      {/* Animated rectangles */}
      <AnimatedRectangles />

      {/* Animated celebration effect */}
      {isAccepted && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-transparent to-orange-50/30 pointer-events-none"
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <div className="w-full max-w-7xl mx-auto px-8 py-12 md:py-16 lg:py-20 relative z-10 min-h-screen flex items-center">
        <div className="w-full space-y-16 md:space-y-20 lg:space-y-24">
          <motion.header
            className="space-y-8 md:space-y-12 lg:space-y-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-none font-light text-amber-950 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {isAccepted ? 'See you there' : 'Thanks'}
            </motion.h1>

            <motion.p
              className={`text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light ${isAccepted ? 'text-orange-600' : 'text-gray-600'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {isAccepted ? 'We look forward to seeing you' : 'Thank you for letting us know'}
            </motion.p>
          </motion.header>

          <motion.section
            className="space-y-8 md:space-y-10 lg:space-y-12 max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isAccepted ? (
              <div className="space-y-6 md:space-y-8">
                <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-700 leading-relaxed">
                  We're excited to have you at {party?.title}
                </p>
                <p className="text-base md:text-lg lg:text-xl text-gray-500">
                  You can return to this invitation anytime with your code.
                </p>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-700 leading-relaxed">
                  We understand you can't make it to {party?.title}
                </p>
                <p className="text-base md:text-lg lg:text-xl text-gray-500">
                  Maybe next time — we'll miss you!
                </p>
              </div>
            )}
          </motion.section>

          {isAccepted && party && (
            <motion.section
              className="space-y-10 md:space-y-12 lg:space-y-16 max-w-5xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="grid md:grid-cols-2 gap-10 md:gap-12 lg:gap-16">
                <div className="space-y-3 md:space-y-4">
                  <div className="text-lg md:text-xl lg:text-2xl text-gray-500">When</div>
                  <div className="text-xl md:text-2xl lg:text-3xl font-light text-amber-950">
                    {new Date(party.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="text-lg md:text-xl lg:text-2xl text-gray-500">Where</div>
                  <div className="text-xl md:text-2xl lg:text-3xl font-light text-amber-950">{party.location}</div>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </TreeBackground>
  );
}

function PartyAndRSVPScroll({ onRSVPSubmitted }: { onRSVPSubmitted: () => void }) {
  const { party, loading, error } = useParty();
  const { formData, validation, isSubmitting, submitError, updateField, submitRSVP } = useRSVP();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitRSVP();
    if (success) {
      onRSVPSubmitted();
    }
  };

  const getFieldError = (field: string) => {
    return validation.errors.find(error => error.field === field)?.message;
  };

  if (loading) {
    return (
      <TreeBackground className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl md:text-8xl font-light text-amber-950 animate-pulse">Loading</div>
        </motion.div>
      </TreeBackground>
    );
  }

  if (error || !party) {
    return (
      <TreeBackground className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <motion.div
          className="space-y-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-6xl md:text-8xl font-light text-amber-950">Error</h1>
          <p className="text-xl md:text-2xl text-gray-500">{error || 'Party not found'}</p>
        </motion.div>
      </TreeBackground>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      month: date.toLocaleDateString('en-US', { month: 'long' }),
      day: date.getDate(),
      year: date.getFullYear()
    };
  };

  const { dayName, month, day, year } = formatDate(party.date);

  return (
    <TreeBackground className="min-h-screen bg-[#fdfbf7] relative overflow-y-auto">
      {/* Interactive dot grid background */}
      <InteractiveDotGrid />


      {/* Animated rectangles */}
      <AnimatedRectangles />

      <div className="w-full max-w-7xl mx-auto px-8 py-12 md:py-16 lg:py-20 relative z-10">
        <div className="space-y-24 md:space-y-32 lg:space-y-40">
          {/* Party Preview Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-16 md:space-y-20 lg:space-y-24">
              <motion.header
                className="space-y-8 md:space-y-10 lg:space-y-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-none font-light text-amber-950 tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  {party.title}
                </motion.h1>
              </motion.header>

              <motion.div
                className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 max-w-6xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="space-y-2">
                  <div className="text-xl md:text-2xl text-gray-500 font-semi">When</div>
                  <div className="space-y-4">
                    <motion.div
                      className="text-7xl md:text-8xl lg:text-9xl leading-none text-orange-600"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {day}
                    </motion.div>
                    <div className="text-3xl md:text-4xl font-light text-amber-950">{month} {year}</div>
                    <div className="text-lg md:text-xl text-gray-500">{dayName}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xl md:text-2xl text-gray-500">Where</div>
                  <div className="text-3xl md:text-4xl lg:text-5xl font-light text-amber-950 leading-tight">
                    {party.location}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="space-y-8 md:space-y-10 lg:space-y-12 max-w-4xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-700 leading-relaxed">
                  {party.description}
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* RSVP Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-24">
              <motion.header
                className="space-y-8 md:space-y-10 lg:space-y-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.h2
                  className="text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] leading-none font-light text-amber-950 tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  RSVP
                </motion.h2>
              </motion.header>

              <motion.section
                className="space-y-16 max-w-4xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="grid md:grid-cols-2 gap-16">
                  <div className="space-y-6">
                    <label htmlFor="name" className="block text-xl md:text-2xl text-gray-500">
                      Your name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full px-0 py-4 bg-transparent text-3xl md:text-4xl font-light focus:outline-none placeholder:text-gray-200 border-b-2 border-gray-900"
                      disabled={isSubmitting}
                    />
                    {getFieldError('name') && (
                      <motion.p
                        className="text-red-500 text-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {getFieldError('name')}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-6">
                    <label htmlFor="phone" className="block text-xl md:text-2xl text-gray-500">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-0 py-4 bg-transparent text-3xl md:text-4xl font-light focus:outline-none placeholder:text-gray-200 border-b-2 border-gray-900"
                      disabled={isSubmitting}
                    />
                    {getFieldError('phone') && (
                      <motion.p
                        className="text-red-500 text-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {getFieldError('phone')}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.section>

              <motion.section
                className="space-y-12 max-w-4xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="text-xl md:text-2xl text-gray-500">Will you attend?</div>

                <div className="grid md:grid-cols-2 gap-8">
                  <motion.label
                    className="cursor-pointer group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <input
                      type="radio"
                      name="rsvpStatus"
                      value="accepted"
                      checked={formData.rsvpStatus === 'accepted'}
                      onChange={(e) => updateField('rsvpStatus', e.target.value)}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <div className={`p-8 md:p-12 transition-all ${
                      formData.rsvpStatus === 'accepted'
                        ? 'bg-orange-600 text-white'
                        : 'border-2 border-amber-200 group-hover:border-amber-400'
                    }`}>
                      <div className="text-5xl md:text-6xl font-light">Yes</div>
                      <div className="text-lg md:text-xl mt-4 opacity-80">I'll be there</div>
                    </div>
                  </motion.label>

                  <motion.label
                    className="cursor-pointer group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <input
                      type="radio"
                      name="rsvpStatus"
                      value="declined"
                      checked={formData.rsvpStatus === 'declined'}
                      onChange={(e) => updateField('rsvpStatus', e.target.value)}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <div className={`p-8 md:p-12 transition-all ${
                      formData.rsvpStatus === 'declined'
                        ? 'bg-amber-900 text-white'
                        : 'border-2 border-amber-200 group-hover:border-amber-400'
                    }`}>
                      <div className="text-5xl md:text-6xl font-light">No</div>
                      <div className="text-lg md:text-xl mt-4 opacity-80">Can't make it</div>
                    </div>
                  </motion.label>
                </div>
              </motion.section>

              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-red-500 text-lg">
                    {submitError}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-2xl text-amber-950 hover:text-orange-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit →'}
                </motion.button>
              </motion.div>
            </form>
          </motion.section>
        </div>
      </div>
    </TreeBackground>
  );
}

function InvitationContent() {
  const { party, fetchParty } = useParty();
  const [currentStep, setCurrentStep] = useState<'code-entry' | 'party-and-rsvp' | 'confirmation'>('code-entry');

  const handleValidCode = async (code: string) => {
    await fetchParty(code);
    setCurrentStep('party-and-rsvp');
  };

  const handleRSVPSubmitted = () => {
    setCurrentStep('confirmation');
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.8
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'code-entry':
        return <CodeEntryForm onValidCode={handleValidCode} />;
      case 'party-and-rsvp':
        return <PartyAndRSVPScroll onRSVPSubmitted={handleRSVPSubmitted} />;
      case 'confirmation':
        return <Confirmation />;
      default:
        return <CodeEntryForm onValidCode={handleValidCode} />;
    }
  };

  return (
    <motion.div
      key={currentStep}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {renderStep()}
    </motion.div>
  );
}

export default function ExamplePartyPage() {
  return (
    <PartyProvider>
      <GuestProvider>
        <RSVPProvider>
          <InvitationContent />
        </RSVPProvider>
      </GuestProvider>
    </PartyProvider>
  );
}
