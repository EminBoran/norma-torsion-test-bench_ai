(* ============================================================================== *)
(*  NORMA TORSION TEST BENCH - CODESYS IEC 61131-3 SOFT-SPS CONTROLLER           *)
(*  Zyklischer 2ms Echtzeit-Task auf Raspberry Pi 5 via PROFINET IO              *)
(* ============================================================================== *)

PROGRAM PLC_PRG
VAR
    (* PROFINET E/A Mapping (Direkt angebunden an Baumer CM50I.PN) *)
    (* Slot 1: Port X0 Halstrup-Walcher PSE 3325 *)
    bMotorStatusWord  AT %IB0 : WORD;   (* Statuswort des Stellantriebs *)
    diMotorPosInc     AT %ID2 : DINT;   (* Aktuelle Ist-Position in Inkrementen *)
    
    bMotorControlWord AT %QB0 : WORD;   (* Steuerwort: 0x0014=Pos, 0x0011=Jog+, 0x0000=Stop *)
    diMotorTargetInc  AT %QD2 : DINT;   (* Soll-Position in Inkrementen *)

    (* Slot 2: Port X1 HBM T22 Drehmomentmesswelle *)
    iTorqueRaw        AT %IB6 : INT;    (* Drehmoment Rohwert 16-Bit *)

    (* Slot 3: Port X2 ifm Temperatursensor *)
    iTempRaw          AT %IB8 : INT;    (* Temperatur Rohwert *)

    (* Slot 4: Port X3 ifm Farbanzeige & Taster *)
    bButtonX3         AT %IB10 : BYTE;  (* Taster X3 *)
    bLedColorX3       AT %QB6  : BYTE;  (* LED Farbe: 1=Grün, 2=Gelb, 4=Rot, 5=Blau *)

    (* Slot 6 & 7: Digitaleingänge X5 & X6 *)
    bTriggerX5        AT %IB12 : BYTE;  (* 24V Digitaleingang X5 *)
    bEndlageX6        AT %IB13 : BYTE;  (* Endlagensensor X6 *)

    (* Interne Prozessvariablen *)
    rLiveTorqueNm     : REAL := 0.0;
    rPeakTorqueNm     : REAL := 0.0;
    rLiveMotorDeg     : REAL := 0.0;
    
    (* Prüfstands-Parameter *)
    rStartNm          : REAL := 0.50;   (* Prüfgrenze Nm *)
    rTorqueOffset     : REAL := 0.00;
    iState            : INT  := 0;      (* 0=IDLE, 1=ANFAHREN, 3=PRUEFFAHRT, 4=NACHLAUF, 10=HOMING *)
    bCmdStart         : BOOL := FALSE;
    bCmdStop          : BOOL := FALSE;
    bCmdHome          : BOOL := FALSE;
    bCmdTare          : BOOL := FALSE;
    bProfinetBusOk    : BOOL := TRUE;
    
    (* Schnelle Hardware-Abschaltung (< 2ms) *)
    tStateTimer       : TON;
    tDwellTimer       : TON;
END_VAR

(* 1. Skalierung & Filterung der Messdaten *)
rLiveTorqueNm := (INT_TO_REAL(iTorqueRaw) * 0.001) - rTorqueOffset;
rLiveMotorDeg := DINT_TO_REAL(diMotorPosInc - 51200) / 142.222;

IF rLiveTorqueNm > rPeakTorqueNm THEN
    rPeakTorqueNm := rLiveTorqueNm;
END_IF;

(* 2. Schnelle Tara-Funktion *)
IF bCmdTare THEN
    rTorqueOffset := INT_TO_REAL(iTorqueRaw) * 0.001;
    rPeakTorqueNm := 0.0;
    bCmdTare := FALSE;
END_IF;

(* 3. Echtzeit-Zustandsmaschine (State Machine) *)
CASE iState OF
    0: (* IDLE *)
        bMotorControlWord := 16#0000; (* Halt *)
        bLedColorX3 := 16#05;         (* Blau: Bereit *)
        
        IF bCmdStart THEN
            bCmdStart := FALSE;
            rPeakTorqueNm := 0.0;
            iState := 1; (* Start Prüfablauf *)
        ELSIF bCmdHome THEN
            bCmdHome := FALSE;
            iState := 10; (* Homing *)
        END_IF;

    1: (* PHASE 1: Voranzug / Anfahren *)
        bMotorControlWord := 16#0011; (* Drehen Rechts mit definierter Drehzahl *)
        bLedColorX3 := 16#02;         (* Gelb *)
        
        IF rLiveTorqueNm >= rStartNm THEN
            bMotorControlWord := 16#0000; (* Sofortiger Stopp *)
            iState := 3; (* Weiter zur Prüffahrt *)
        END_IF;

    3: (* PHASE 3: Kontrollierte Torsionsprüfung *)
        bMotorControlWord := 16#0014; (* Positionierbefehl *)
        diMotorTargetInc := diMotorPosInc + 2133; (* z. B. +15.0° Nachlauf *)
        bLedColorX3 := 16#04;         (* Rot: Test aktiv *)
        iState := 4;

    4: (* PHASE 4: Nachlauf & Auswertung *)
        IF diMotorPosInc >= diMotorTargetInc OR rLiveTorqueNm > (rStartNm * 1.5) THEN
            bMotorControlWord := 16#0000; (* Stopp *)
            bLedColorX3 := 16#01;         (* Grün: Prüfung erfolgreich *)
            iState := 0;                  (* Zurück zu Idle *)
        END_IF;

    10: (* HOMING: Nullpunkt 51200 Inc anfahren *)
        bMotorControlWord := 16#0014;
        diMotorTargetInc := 51200;
        bLedColorX3 := 16#02;
        
        IF ABS(diMotorPosInc - 51200) <= 5 THEN
            bMotorControlWord := 16#0000;
            iState := 0;
        END_IF;
END_CASE;

(* Sicherheits-Not-Halt *)
IF bCmdStop THEN
    bMotorControlWord := 16#0000;
    iState := 0;
    bCmdStop := FALSE;
END_IF;
