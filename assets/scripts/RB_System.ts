import { _decorator, Component, RigidBody, Vec3, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RB_System')
export class RB_System extends Component {

    public static instance: RB_System | null = null;

    private bodies: Set<RigidBody> = new Set<RigidBody>();

    onLoad() {
        if (!RB_System.instance) {
            RB_System.instance = this;
        } else {
            console.error("RB_System instance already exists!");
        }
    }

    start() {
        //this.bodies = new Set<RigidBody>();
    }

    public registerBody(body: RigidBody) {
        if (!body) {
            console.log("Tried to register a null body");
            return;
        }
        this.bodies.add(body);
        console.log("Added body", body.node.name, this.bodies.size);
    }

    public unregisterBody_R(body: RigidBody) {
        if (this.containsBody(body)) {
            this.bodies.delete(body);
            console.log("Removed body", body.node.name, this.bodies.size);
        }
    }

    public unregisterBody_N(body: Node) {
        const rb = body.getComponent(RigidBody);
        if (this.containsBody(rb)) {
            this.bodies.delete(rb);
            console.log("Removed body", body.name, this.bodies.size);
        }
    }

    public containsBody(body: RigidBody): boolean {
        return this.bodies.has(body);
    }

    public getBodiesInRadius(center: Vec3, radius: number): RigidBody[] {
        console.log("S: ", this.bodies.size);
        const res: RigidBody[] = [];
        for (const body of this.bodies) {
            if (!body.node) {
                this.unregisterBody_R(body);
                continue;
            }
            if (Vec3.distance(body.node.position, center) <= radius) {
                res.push(body);
            }
        }
        return res;
    }

    public getBodiesNearSegment(start: Vec3, end: Vec3, radius: number): RigidBody[] {
        //console.log("1");
        const result: RigidBody[] = [];
        for (const rb of this.bodies) {
            //console.log("2");
            const position = rb.node.getWorldPosition();
            const distance = this.distanceToSegment(position, start, end);
            if (distance <= radius) {
                //console.log("3");
                result.push(rb);
            }
        }
        return result;
    }

    private distanceToSegment(point: Vec3, start: Vec3, end: Vec3): number {
        //console.log("4");
        const segment = new Vec3();
        Vec3.subtract(segment, end, start);
        const segmentLengthSquared = segment.lengthSqr();

        // Start and end are basically the same point.
        if (segmentLengthSquared < 0.000001) {
            return Vec3.distance(point, start);
        }

        //console.log("5");
        const pointToStart = new Vec3();
        Vec3.subtract(pointToStart, point, start);

        // Project pointToStart onto the segment.
        let t = Vec3.dot(pointToStart, segment) / segmentLengthSquared;

        // Clamp projection to the actual segment.
        t = Math.max(0, Math.min(1, t));
        const closestPoint = new Vec3();
        Vec3.scaleAndAdd(closestPoint, start, segment, t);

        return Vec3.distance(point, closestPoint);
    }

    update(dt: number) {
        
    }
}

