const canvas = document.getElementById("canvas");
const borderCr = 1;

// vector
class Vector {
  constructor(x, y) {
    this._x = x;
    this._y = y;
  }

  set x(value) {
    this._x = value;
  }

  get x() {
    return this._x;
  }

  set y(value) {
    this._y = value;
  }

  get y() {
    return this._y;
  }

  get value() {
    return (this.x ** 2 + this.y ** 2) ** (1 / 2);
  }

  get str() {
    return this.x.toFixed(2) + ", " + this.y.toFixed(2);
  }

  print() {
    console.log(this.str);
  }

  sum(v2) {
    return new Vector(this.x + v2.x, this.y + v2.y);
  }

  diff(v2) {
    return new Vector(this.x - v2.x, this.y - v2.y);
  }

  multScalar(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  divScalar(scalar) {
    return new Vector(this.x / scalar, this.y / scalar);
  }
}

// point mass
class Point {
  constructor(x, y, m, v) {
    // m, v are optional
    this._x = x;
    this._y = y;

    if (typeof arguments[2] == "object") {
      // if 3rd argument is a vector, m was not given
      m = 1;
      v = arguments[2];
    } else {
      m = arguments[2];
      v = arguments[3];
    }

    // m is optional, so if not given, set to 1
    if (m === undefined) m = 1;
    this._m = m;

    // v is optional, so if not given, set to 0
    if (v === undefined) v = new Vector(0, 0);
    this.v = v;
  }

  set x(value) {
    this._x = value;
  }

  get x() {
    return this._x;
  }

  set y(value) {
    this._y = value;
  }

  get y() {
    return this._y;
  }

  get relativeX() {
    return this.x;
  }

  get relativeY() {
    return canvas.getBoundingClientRect().bottom - this.y;
  }

  set m(value) {
    if (value >= 0) {
      this._m = value;
    } else {
      var msg = "Cannot set mass to a negative number! Value given: " + value;
      printLog(msg);
      console.log(msg);
    }
  }

  get m() {
    return this._m;
  }

  set vx(value) {
    this.v.x = value;
  }

  get vx() {
    return this.v.x;
  }

  set vy(value) {
    this.v.y = value;
  }

  get vy() {
    return this.v.y;
  }

  // momentum = mass * velocity
  get momentum() {
    return this.v.multScalar(this.m);
  }

  // distance to collide with something
  get collisionDistance() {
    // overload in children
    return 0;
  }

  get strPos() {
    return this.x.toFixed(2) + ", " + this.y.toFixed(2);
  }

  get strV() {
    return this.v.str;
  }

  get str() {
    var tmp = "position: (" + this.strPos + ")\nvelocity: (" + this.strV + ")";
    if (this.m > 0) tmp += "\nmass: " + this.m.toFixed(2);
    return tmp;
  }

  print() {
    console.log(this.str);
  }

  // move this point by given vector
  move(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }

  // update position, check border collision
  update() {
    // todo: kinematics?
    this.move(this.v);
    this.borderCollide(canvas);
  }

  // check if this collides with the canvas border
  borderCollide(c) {
    var collision = false;
    if (this.y + this.collisionDistance > c.height) {
      this.vy = -this.vy;
      this.y = c.height - this.collisionDistance;
      collision = true;
    } else if (this.y - this.collisionDistance < 0) {
      this.vy = -this.vy;
      this.y = 0 + this.collisionDistance;
      collision = true;
    }
    if (this.x - this.collisionDistance < 0) {
      this.vx = -this.vx;
      this.x = 0 + this.collisionDistance;
      collision = true;
    } else if (this.x + this.collisionDistance > c.width) {
      this.vx = -this.vx;
      this.x = c.width - this.collisionDistance;
      collision = true;
    }
    if (collision) {
      this.v = this.v.multScalar(borderCr);
    }
  }

  // get distance between 2 points
  getDistance(point2) {
    return ((this.x - point2.x) ** 2 + (this.y - point2.y) ** 2) ** (1 / 2);
  }

  // check if this point and a given other point are within collision distance
  isColliding(point2) {
    return this.collisionDistance + point2.collisionDistance > this.getDistance(point2);
  }

  // calculate final momentum of this point when colliding with point2
  getCollisionVf(point2, Cr) {
    // using coefficient of restitution, Cr. this will change depending on the object this is colliding with
    // FUCK
    // JavaScript can't overload operators. Either need to extend JS with custom features (SweetJS?) or do a ValueOf thing, which can't return a new vector
    //https://stackoverflow.com/questions/19620667/javascript-operator-overloading
    // *touches statement sadly* perhaps someday...
    //Anyways the commented statement is a much easier-to-read version of the calculation. See wikipedia page for "coefficient of restitution" for formulae. Also the below khan academy page for more detail.
    // https://www.khanacademy.org/science/physics/linear-momentum/elastic-and-inelastic-collisions/a/what-are-elastic-and-inelastic-collisions
    // return ((ball1.v * ball1.mass) + (ball2.v * ball2.mass) + (ball2.mass * ball1.Cr * (ball2.v - ball1.v))) / (ball1.mass + ball2.mass)
    return this.momentum
      .sum(point2.momentum)
      .sum(point2.v.diff(this.v).multScalar(point2.m * Cr))
      .divScalar(this.m + point2.m);
  }

  // process of collision
  collides(point2, Cr) {
    if (this.isColliding(point2) && this.v.value > 0.01 && point2.v.value > 0.01) {
      var msg = "before collision";
      if (this.collisionDistance + point2.collisionDistance > 0) {
        msg += "\ncollision distance: " + (this.collisionDistance + point2.collisionDistance).toFixed(2);
      }
      if (this.getDistance(point2) > 0) {
        msg += "\ndistance: " + this.getDistance(point2).toFixed(2);
      }

      //velocity adjustments
      var tmp = this.getCollisionVf(point2, Cr);
      point2.v = point2.getCollisionVf(this, 1);
      this.v = tmp;
    }
  }
}

//balls
class Ball extends Point {
  constructor(xOrigin, yOrigin, radius, name, color) {
    super(xOrigin, yOrigin, new Vector(Math.random() * 7 - 3, Math.random() * 7 - 3));
    this.radius = radius;
    this.name = name;
    this.color = color;
    this.renderCat = false;
  }

  matchesName(checkName, matchCase) {
    let thisName = this.name;
    if (!matchCase) {
      thisName = this.name.toLowerCase().trim();
      checkName = checkName.toLowerCase().trim();
    }
    return thisName == checkName;
  }

  get str() {
    return super.str + "\nradius: " + this.radius.toFixed(2);
  }

  get m() {
    return Math.PI * this.radius ** 2;
  }

  get collisionDistance() {
    // overloads
    return this.radius;
  }

  draw(ctx) {
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    if (this.renderCat) {
      ctx.drawImage(document.getElementById("floppy_cat"), this.x - 40, this.y - 40);
      ctx.fillText(this.name.charAt(0), this.x - 8, this.y - 1);
    } else {
      ctx.drawImage(document.getElementById("floppy"), this.x - 24, this.y - 24);
      ctx.fillText(this.name.charAt(0), this.x - 8, this.y - 1);
    }
  }

  update(posX, posY, c) {
    // this.vy += this.gravity;
    super.update();
  }

  mouseCollide(posX, posY) {
    //line segment intersecting circle is gonna be hard >_>
  }

  collides(ball2, Cr) {
    // overloads
    super.collides(ball2, Cr);

    if (this.isColliding(ball2)) {
      //reset position to get rid of overlap (separation)
      var overlap = this.collisionDistance + ball2.collisionDistance - this.getDistance(ball2) + 1;
      var xOver = overlap * Math.cos(Math.atan(Math.abs((this.y - ball2.y) / (this.x - ball2.x))));
      var yOver = overlap * Math.sin(Math.atan(Math.abs((this.y - ball2.y) / (this.x - ball2.x))));

      if (this.x <= ball2.x) {
        this.x -= xOver / 2;
        ball2.x += xOver / 2;
      } else {
        this.x += xOver / 2;
        ball2.x -= xOver / 2;
      }
      if (this.y <= ball2.y) {
        this.y -= yOver / 2;
        ball2.y += yOver / 2;
      } else {
        this.y += yOver / 2;
        ball2.y -= yOver / 2;
      }
    }
  }
}

const balls = {};
function createBall(userID, name, color) {
  balls[userID] = new Ball(Math.random() * 1400 + 100, Math.random() * 700 + 100, 24, name, color);
}
createBall("M", "M", "#ffffff");

function ballPhysics(c) {
  //canvas variable setup and frame refresh
  const ctx = c.getContext("2d");
  ctx.canvas.width = c.width;
  ctx.lineWidth = 2;
  ctx.font = "24px W95FA";

  for (let i in balls) {
    balls[i].update(0, 0, c);

    if (Object.keys(balls).length > 1) {
      for (let j in balls) {
        if (j != i) {
          balls[i].collides(balls[j], 1);
        }
      }
    }
  }
  for (let i in balls) {
    balls[i].draw(ctx);
  }
}

function SaveAsFile(t, f, m) {
  try {
    var b = new Blob([t], { type: m });
    saveAs(b, f);
  } catch (e) {
    window.open("data:" + m + "," + encodeURIComponent(t), "_blank", "");
  }
}

function saveJSON() {
  // console.log(text);
  SaveAsFile(JSON.stringify(balls), "export_floppy.json", "text/json;charset=utf-8");
}

const client = new tmi.Client({
  channels: ["mmica442"],
});
client.connect();
// client.join("mmica442");

client.on("message", (channel, tags, message, self) => {
  let currentUserID = tags["user-id"];
  let uniformMessage = message.toLowerCase().trim();

  // add ball or update color
  if (currentUserID in balls) {
    balls[currentUserID].color = tags["color"];
  } else {
    createBall(currentUserID, tags["display-name"], tags["color"]);
  }

  // check for catting/uncatting self
  if (uniformMessage.startsWith("!cat")) {
    // i have the power to cat at will (comment/uncomment for debugging)
    if (currentUserID == "720767504") {
      let splitMessage = uniformMessage.split(" ");
      if (splitMessage.length > 1) {
        let findUser = null;
        for (let i in balls) {
          if (balls[i].matchesName(splitMessage[1], false)) {
            findUser = balls[i];
            break;
          }
        }
        findUser.renderCat = true;
      }
    }
    // cat the user
    balls[currentUserID].renderCat = true;
  } else if (uniformMessage.startsWith("!uncat")) {
    // i have the power to uncat at will (comment/uncomment for debugging)
    if (currentUserID == "720767504") {
      let splitMessage = uniformMessage.split(" ");
      if (splitMessage.length > 1) {
        let findUser = null;
        for (let i in balls) {
          if (balls[i].matchesName(splitMessage[1], false)) {
            findUser = balls[i];
            break;
          }
        }
        findUser.renderCat = false;
      } else {
        balls[currentUserID].renderCat = false;
      }
    }
    // uncat the user
    balls[currentUserID].renderCat = false;
  }

  // check for custom reward ID
  if (tags.hasOwnProperty("custom-reward-id")) {
    switch (tags["custom-reward-id"]) {
      case "87af0b1e-c952-4450-af08-5f74e506fb9b":
        let findUser = null;
        for (let i in balls) {
          if (balls[i].matchesName(message, false)) {
            findUser = balls[i];
            break;
          }
        }
        findUser.renderCat = false;
        // client.say("mmica442", "I can't believe you've un-catted " + message + "...");
        break;
    }
  }
});

function main() {
  ballPhysics(canvas);
  var repeater = window.setTimeout(main, 10); //~100 fps max
}
