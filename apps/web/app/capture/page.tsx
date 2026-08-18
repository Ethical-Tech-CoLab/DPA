import type { Metadata } from "next";
import CaptureSimulator from "../../components/CaptureSimulator";

export const metadata: Metadata = {
  title: "Capture — DPA v0.4",
  description:
    "Stage 0: a protocol for crowd-sourced 3D capture that creates the beginning of a provenance trail, and rates the contribution honestly while it is being made.",
};

export default function CapturePage() {
  return (
    <main>
      <div className="hero">
        <div className="hero-lead">
          <p className="label">Stage 0 · @dpa/capture</p>
          <h1>Creating record, not querying it</h1>
        </div>
        <div className="hero-body">
          <p className="lede">
            Every other stage in this system begins after an object has already
            been recorded by somebody. Where no record was ever created, all they
            can do is measure the hole. This is the stage that fills it.
          </p>
        </div>
      </div>

      <div className="card warn" style={{ marginTop: 24 }}>
        <p className="label">What this page is</p>
        <p>
          A working demonstration of the rubric and the real-time guidance loop,
          driven by sliders rather than a camera.{" "}
          <strong>There is no mobile capture client yet</strong> and nothing here
          measures a photograph. What is real is the logic: how ten measurements
          become one fitness class, one instruction, and a record that states its
          own limits. Every number on this page is computed live by{" "}
          <code>@dpa/capture</code>.
        </p>
      </div>

      <h2 style={{ marginTop: 40 }}>Why this is the priority</h2>

      <p>
        The Bura askos scores <strong>58</strong> with{" "}
        <strong>0 of 9 registers</strong> able to name it. That is not a gap in
        our searching. Bura funerary sites were never inventoried, and INTERPOL,
        the FBI National Stolen Art File and the Carabinieri TPC archive hold
        reports of thefts <em>from documented collections</em>. An object from an
        unrecorded site cannot appear in them, ever, however much is later learned
        about it.
      </p>

      <p>
        The object&rsquo;s own timeline records the trap exactly: Niger ratified
        the 1970 UNESCO Convention in 1997, but the Convention{" "}
        <em>
          &ldquo;requires a pre-existing inventory — which Bura sites lack.&rdquo;
        </em>
      </p>

      <p>
        Capture is the only mechanism in this programme that creates record
        rather than querying it. It cannot help an object already looted from an
        unrecorded site. It can start the record, from today, for everything still
        in museum, community or private custody — which is most of the material
        this programme exists for.
      </p>

      <h2 style={{ marginTop: 40 }}>Three numbers, three questions</h2>

      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Asks</th>
            <th>Owned by</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>confidenceScore</code>
            </td>
            <td>How much is known about where this object came from?</td>
            <td>
              <code>@dpa/assess</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>coverage</code>
            </td>
            <td>Could the registers have known anything at all?</td>
            <td>
              <code>@dpa/assess</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>qualityScore</code>
            </td>
            <td>How good is the record we just made of the object itself?</td>
            <td>
              <code>@dpa/capture</code>
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        These never mix. <code>@dpa/capture</code> may not import{" "}
        <code>@dpa/assess</code> and <code>@dpa/assess</code> may not import{" "}
        <code>@dpa/capture</code>; a test asserts it at the module boundary.
        Otherwise{" "}
        <strong>
          a museum could raise an object&rsquo;s provenance confidence by buying a
          better camera
        </strong>
        , and an institution with a well-funded imaging department and no
        documentation would outscore a community holding thorough written records
        and a phone.
      </p>

      <CaptureSimulator />

      <h2 style={{ marginTop: 48 }}>Where the chain breaks today</h2>

      <p>
        C2PA solves capture-time provenance for photographs well — a hard binding
        over the asset bytes, an X.509 signature, an RFC 3161 timestamp, and in
        Truepic&rsquo;s implementation a signature applied inside the secure
        enclave before the image leaves the sensor.
      </p>

      <p>
        <strong>None of it survives photogrammetry.</strong> As of spec v2.1–v2.4
        the normative format list is JPEG, PNG, GIF, TIFF, BMFF video and PDF.
        glTF/GLB, USDZ, E57 and PLY are absent. The photographs can be sealed to a
        very high standard and the mesh built from them inherits none of it. The
        chain breaks at exactly the step that produces the artefact anyone will
        actually look at.
      </p>

      <p>
        Every crowd-sourced heritage capture effort we surveyed — Rekrei/Project
        Mosul, Backup Ukraine, the Million Image Database — used general-purpose
        photogrammetry apps and sealed the 3D output not at all. Rekrei accepts any
        photograph with no submission quality protocol whatsoever.
      </p>

      <p>
        <code>ReconstructionBinding</code> is our answer: one signed structure
        binding the source image set, how many of those carried a verifiable seal,
        the pipeline and its parameters, the output mesh hash, and a perceptual
        hash as a soft binding so a re-exported copy can be re-associated. It does{" "}
        <em>not</em> make reconstruction reproducible — photogrammetry is not
        bit-deterministic — and <code>chainComplete</code> says so rather than
        implying a guarantee the format cannot make.
      </p>

      <div className="card warn" style={{ marginTop: 24 }}>
        <p className="label">One citation we could not verify</p>
        <p>
          The feedback that prompted this work cited a{" "}
          <strong>
            &ldquo;Manhattan Bridge pedestrian capture protocol.&rdquo;
          </strong>{" "}
          No protocol of that name exists in any public source we could reach —
          not the Library of Congress HAER record for the bridge, not Starling
          Lab, not C2PA, not NYC DOT. The closest real thing is Starling Lab and
          Numbers Protocol&rsquo;s <code>Starlingcapture</code>, which anchors a
          cryptographic birth certificate in device hardware at capture time. We
          are not treating it as prior art until the original source is
          identified. The design above is grounded in what we could verify:
          Apple&rsquo;s <code>ObjectCaptureSession</code>, the C2PA specification,
          and the London Charter.
        </p>
      </div>

      <h2 style={{ marginTop: 40 }}>What is not built</h2>
      <ul className="reg-list">
        <li>
          <strong>No metric extractors.</strong> The rubric is defined and nothing
          computes it from actual photographs yet.
        </li>
        <li>
          <strong>No mobile client.</strong> Whether to build one, extend VANGO,
          or wrap Apple&rsquo;s Object Capture is an open decision — and it
          reopens ADR-007, which placed VANGO outside the core on the premise that
          capture was out of scope.
        </li>
        <li>
          <strong>No issuer class for a contributor.</strong> Someone who scans an
          object they do not own is neither a pseudonymous holder nor an
          accredited institution. ADR-004 is reopened.
        </li>
        <li>
          <strong>Consent is unresolved and now blocking.</strong> Defaults are
          set closed — funerary and sacred material is held at source-community
          tier — which buys time and is not a substitute for asking.
        </li>
        <li>
          <strong>Thresholds are ours.</strong> There is no ratified cross-body
          numerical rubric for heritage 3D capture; the London Charter, the most
          widely adopted framework, is a principles document. Every band sits in
          one file so the argument can be had against specific numbers.
        </li>
      </ul>
    </main>
  );
}
