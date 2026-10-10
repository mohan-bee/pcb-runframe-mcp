import { sel } from "tscircuit"

export default () => (
  <board width="30mm" height="20mm" routingDisabled={false}>
    <battery name="B1" voltage="5V" pcbX={-10} />
    <resistor name="R1" resistance="330ohm" footprint="0603" pcbX={-2} />
    <led name="LED1" color="red" footprint="0603" pcbX={7} />
    <trace from={sel.B1.pos} to={sel.R1.pin1} />
    <trace from={sel.R1.pin2} to={sel.LED1.anode} />
    <trace from={sel.LED1.cathode} to={sel.B1.neg} />
  </board>
)
