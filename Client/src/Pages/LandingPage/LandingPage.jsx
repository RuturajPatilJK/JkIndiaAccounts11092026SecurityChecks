import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jkLogoImg from '../../Assets/jkIndia.png';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Signika:wght@300..700&display=swap');
@keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
@keyframes lp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
`;

function ChoiceCard({ icon, title, description, gradient, hoverGlow, badge, onClick }) {
    const [hovered, setHovered] = React.useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: 340, borderRadius: 22, padding: '34px 30px',
                background: gradient,
                border: '1px solid rgba(255,255,255,.12)',
                cursor: 'pointer',
                transition: 'transform .22s ease, box-shadow .22s ease',
                transform: hovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)',
             
                position: 'relative', overflow: 'hidden',
                fontFamily: "'Signika', system-ui, sans-serif",
            }}
        >
            {/* Shine bubble */}
            <div style={{
                position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: -30, left: -30, width: 120, height: 120,
                borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none',
            }} />

    
            {/* Icon */}
            <div style={{ marginBottom: 22, animation: hovered ? 'lp-float 2s ease-in-out infinite' : 'none' }}>
                {icon}
            </div>

            {/* Title */}
            <div style={{ color: '#fcfaf4', fontWeight: 800, fontSize: '1.45rem', letterSpacing: '-.025em', marginBottom: 12, lineHeight: 1.15 }}>
                {title}
            </div>

            {/* Description */}
            <div style={{ color: 'rgba(252,250,244,.52)', fontSize: '.83rem', lineHeight: 1.65, fontWeight: 400 }}>
                {description}
            </div>

            {/* Enter arrow */}
            <div style={{
                marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: hovered ? 10 : 6,
                color: 'rgba(252,250,244,.75)', fontSize: '.8rem', fontWeight: 700,
                transition: 'gap .22s ease',
                background: 'rgba(255,255,255,.08)', borderRadius: 99,
                padding: '7px 14px',
            }}>
                <span>Enter</span>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2.5 7.5h10M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        </div>
    );
}

export default function LandingPage() {
    const navigate  = useNavigate();
    const username  = sessionStorage.getItem('username') || 'User';
    const company   = sessionStorage.getItem('Company_Name') || '';
    const year      = sessionStorage.getItem('Accounting_Year') || '';

    useEffect(() => {
        if (!sessionStorage.getItem('username')) navigate('/');
    }, [navigate]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />
            <div style={{
                minHeight: '80vh',

                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Signika', system-ui, sans-serif",
                padding: '36px 20px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Background glows */}
                <div style={{ position: 'absolute', top: '-10%', right: '-8%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,93,64,.22) 0%, transparent 65%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-12%', left: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '40%', left: '50%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,75,.06) 0%, transparent 70%)', pointerEvents: 'none', transform: 'translate(-50%,-50%)' }} />

                {/* Brand pill */}
                {/* <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 99, padding: '8px 18px 8px 8px', marginBottom: 40, zIndex: 1,
                }}>
                    <img src={jkLogoImg} alt="JK India"
                        style={{ height: 38, borderRadius: 99, background: 'rgba(255,255,255,.92)', padding: '3px 7px', objectFit: 'contain' }} />
                    <div>
                        <div style={{ color: '#fcfaf4', fontWeight: 700, fontSize: '.88rem', lineHeight: 1.2 }}>JK India</div>
                        <div style={{ color: 'rgba(252,250,244,.38)', fontSize: '.65rem' }}>eAgriTech Platform</div>
                    </div>
                </div> */}

  
                {/* Cards */}
                <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}>
                    <ChoiceCard
                        icon={
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                                <rect x="4" y="9" width="36" height="27" rx="5" stroke="white" strokeWidth="2" opacity=".9"/>
                                <path d="M4 16h36" stroke="white" strokeWidth="2" opacity=".7"/>
                                <path d="M12 24h8M12 30h14M28 30h4" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
                                <circle cx="10" cy="12.5" r="1.5" fill="white" opacity=".6"/>
                                <circle cx="15" cy="12.5" r="1.5" fill="white" opacity=".6"/>
                                <circle cx="20" cy="12.5" r="1.5" fill="white" opacity=".6"/>
                            </svg>
                        }
                        title="Account Dashboard"
                    
                        gradient="linear-gradient(145deg, #0e5e40 0%, #042a1c 100%)"
                        hoverGlow="rgba(14,94,64,.5)"
                        badge={null}
                        onClick={() => { navigate('/dashboard'); window.location.reload(); }}
                    />

                    <ChoiceCard
                        icon={
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                                <path d="M6 34L16 22l7 7 9-12 6 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".9"/>
                                <path d="M8 38h28" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".3"/>
                                <circle cx="36" cy="11" r="5" fill="rgba(255,255,255,.15)" stroke="white" strokeWidth="1.8"/>
                                <circle cx="36" cy="11" r="2" fill="white"/>
                                <path d="M8 10h14M8 16h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".35"/>
                            </svg>
                        }
                        title="Google Analytics"
                      
                        gradient="linear-gradient(145deg, #1e3a5f 0%, #0c1a35 100%)"
                        hoverGlow="rgba(37,99,235,.35)"
                        badge="Live"
                        onClick={() => navigate('/google-analytics')}
                    />
                </div>
            </div>
        </>
    );
}
