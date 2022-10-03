import type Ammo from 'ammojs-typed';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  EventDispatcher,
  Matrix4,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from "three";

const _plane = new Plane();
const _raycaster = new Raycaster();

const _pointer = new Vector2();
const _offset = new Vector3();
const _intersection = new Vector3();
const _worldPosition = new Vector3();
const _inverseMatrix = new Matrix4();

let _objects: any[] = [],
  _selected: any = undefined,
  _hovered: any = undefined,
  _instanceId: number = 0,
  _prevPos: Vector3 | undefined = undefined,
  _intersections: any[] = [],
  _enabled: boolean = true,
  _transformGroup: boolean = false

class DragControls extends EventDispatcher {
  public activate: Function
  public deactivate: Function
  public dispose: Function
  public setObjects: Function
  public getObjects: Function
  public getRaycaster: Function

  constructor(_camera: any, _domElement: any, _ammo: typeof Ammo, _orbitControls: OrbitControls) {
    super();
    const scope = this

    _domElement.style.touchAction = "none"; // disable touch scroll

    function activate() {
      _domElement.addEventListener("pointermove", onPointerMove);
      _domElement.addEventListener("pointerdown", onPointerDown);
      _domElement.addEventListener("pointerup", onPointerCancel);
      _domElement.addEventListener("pointerleave", onPointerCancel);
    }

    function deactivate() {
      _domElement.removeEventListener("pointermove", onPointerMove);
      _domElement.removeEventListener("pointerdown", onPointerDown);
      _domElement.removeEventListener("pointerup", onPointerCancel);
      _domElement.removeEventListener("pointerleave", onPointerCancel);

      _domElement.style.cursor = "";
    }

    function dispose() {
      deactivate();
    }

    function setObjects(objects: Array<any>) {
      _objects = objects
    }

    function getObjects() {
      return _objects;
    }

    function getRaycaster() {
      return _raycaster;
    }

    function onPointerMove(event: any) {
      if (_enabled === false) return;

      updatePointer(event);

      _raycaster.setFromCamera(_pointer, _camera);

      if (_selected) {
        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          const curPos = _intersection
            .sub(_offset)
            .applyMatrix4(_inverseMatrix);
          if (!_prevPos) {
            _prevPos = curPos.clone();
          }

          if (_ammo) {
            const scalingFactor = 20;
            const diffPos = curPos
              .clone()
              .sub(_prevPos)
              .clone();
            _prevPos = curPos.clone();
            const resultantImpulse = new _ammo.btVector3(
              diffPos.x,
              diffPos.y,
              diffPos.z
            );
            resultantImpulse.op_mul(scalingFactor);
            const physicsBody: Ammo.btRigidBody = _selected.userData.physicsBodies[_instanceId];
            physicsBody.setLinearVelocity(resultantImpulse);
          } else {
            _selected.position.copy(curPos);
          }
        }

        scope.dispatchEvent({ type: "drag", object: _selected });

        return;
      }

      // hover support

      if ((event.pointerType === "mouse" || event.pointerType === "pen") && _objects) {
        _intersections.length = 0;

        _raycaster.setFromCamera(_pointer, _camera);
        _raycaster.intersectObjects(_objects, true, _intersections);

        if (_intersections.length > 0) {
          const object = _intersections[0].object;

          _plane.setFromNormalAndCoplanarPoint(
            _camera.getWorldDirection(_plane.normal),
            _worldPosition.setFromMatrixPosition(object.matrixWorld)
          );

          if (_hovered !== object && _hovered !== undefined) {
            scope.dispatchEvent({ type: "hoveroff", object: _hovered });

            _domElement.style.cursor = "auto";
            _hovered = undefined;
          }

          if (_hovered !== object) {
            scope.dispatchEvent({ type: "hoveron", object: object });

            _domElement.style.cursor = "pointer";
            _hovered = object;
          }
        } else {
          if (_hovered !== undefined) {
            scope.dispatchEvent({ type: "hoveroff", object: _hovered });

            _domElement.style.cursor = "auto";
            _hovered = undefined;
          }
        }
      }
    }

    function onPointerDown(event: any) {
      if (_enabled === false || !_objects) return;

      updatePointer(event);

      _intersections.length = 0;

      _raycaster.setFromCamera(_pointer, _camera);
      _raycaster.intersectObjects(_objects, true, _intersections);

      if (_intersections.length > 0) {
        _selected =
          _transformGroup === true
            ? _objects[0]
            : _intersections[0].object;
        _instanceId = _intersections[0].instanceId;

        _plane.setFromNormalAndCoplanarPoint(
          _camera.getWorldDirection(_plane.normal),
          _worldPosition.setFromMatrixPosition(_selected.matrixWorld)
        );

        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          _inverseMatrix.copy(_selected.parent.matrixWorld).invert();
          _offset
            .copy(_intersection)
            .sub(_worldPosition.setFromMatrixPosition(_selected.matrixWorld));
        }

        _domElement.style.cursor = "move";

        scope.dispatchEvent({ type: "dragstart", object: _selected });
        _orbitControls.enableRotate = false
      }
    }

    function onPointerCancel() {
      if (_enabled === false) return;

      if (_selected) {
        scope.dispatchEvent({ type: "dragend", object: _selected });

        _selected = undefined;
        _prevPos = undefined;
      }

      _domElement.style.cursor = _hovered ? "pointer" : "auto";
      _orbitControls.enableRotate = true
    }

    function updatePointer(event: any) {
      const rect = _domElement.getBoundingClientRect();

      _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    activate();

    // API
    this.activate = activate;
    this.deactivate = deactivate;
    this.dispose = dispose;
    this.setObjects = setObjects;
    this.getObjects = getObjects;
    this.getRaycaster = getRaycaster;
  }
}

export { DragControls };
